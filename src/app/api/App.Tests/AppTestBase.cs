﻿using Abp;
using Abp.EntityFrameworkCore.Extensions;
using Abp.Events.Bus;
using Abp.Events.Bus.Entities;
using Abp.Runtime.Session;
using Abp.TestBase;
using Abp.Timing;
using Castle.Core.Logging;
using GenFu;
using Magicodes.Admin.Authorization.Roles;
using Magicodes.Admin.Authorization.Users;
using Magicodes.Admin.Dto;
using Magicodes.Admin.EntityFrameworkCore;
using Magicodes.Admin.MultiTenancy;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace App.Tests
{
    /// <summary>
    /// This is base class for all our test classes.
    /// It prepares ABP system, modules and a fake, in-memory database.
    /// Seeds database with initial data.
    /// Provides methods to easily work with <see cref="AdminDbContext"/>.
    /// </summary>
    public abstract class AppTestBase : AbpIntegratedTestBase<AppTestModule>
    {
        protected readonly ILogger logger;
        protected AppTestBase()
        {
            SeedTestData();
            LoginAsDefaultTenantAdmin();
            //设置分页等值的默认设置
            A.Configure<PagedAndSortedInputDto>()
                .Fill(p => p.MaxResultCount, filler: () => { return 10; })
                .Fill(p => p.Sorting, filler: () => { return null; })
                .Fill(p => p.SkipCount, filler: () => { return 0; });
            logger = Resolve<ILogger>();
        }

        private void SeedTestData()
        {
            void NormalizeDbContext(AdminDbContext context)
            {
                context.EntityChangeEventHelper = NullEntityChangeEventHelper.Instance;
                context.EventBus = NullEventBus.Instance;
                context.SuppressAutoSetTenantId = true;
            }

            //Seed initial data for default tenant
            AbpSession.TenantId = 1;
            UsingDbContext(context =>
            {
                NormalizeDbContext(context);
            });

            #region 初始化数据

            UsingDbContext(
                context =>
                {
                    var user = User.CreateTenantAdminUser(AbpSession.TenantId.Value, "Test@xin-lai.com");
                    user.Password = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions())).HashPassword(user, "123456abcD");
                    user.UserName = "UnitTest";
                    user.IsEmailConfirmed = true;
                    user.ShouldChangePasswordOnNextLogin = false;
                    user.IsActive = true;
                    user.PhoneNumber = "13671974358";
                    user.IsPhoneNumberConfirmed = true;
                    context.Users.Add(user);
                    context.SaveChanges();
                });
            #endregion
        }

        protected IDisposable UsingTenantId(int? tenantId)
        {
            var previousTenantId = AbpSession.TenantId;
            AbpSession.TenantId = tenantId;
            return new DisposeAction(() => AbpSession.TenantId = previousTenantId);
        }

        protected void UsingDbContext(Action<AdminDbContext> action) => UsingDbContext(AbpSession.TenantId, action);

        protected Task UsingDbContextAsync(Func<AdminDbContext, Task> action) => UsingDbContextAsync(AbpSession.TenantId, action);

        protected T UsingDbContext<T>(Func<AdminDbContext, T> func) => UsingDbContext(AbpSession.TenantId, func);

        protected Task<T> UsingDbContextAsync<T>(Func<AdminDbContext, Task<T>> func) => UsingDbContextAsync(AbpSession.TenantId, func);

        protected void UsingDbContext(int? tenantId, Action<AdminDbContext> action)
        {
            using (UsingTenantId(tenantId))
            {
                using (var context = LocalIocManager.Resolve<AdminDbContext>())
                {
                    action(context);
                    context.SaveChanges();
                }
            }
        }

        protected async Task UsingDbContextAsync(int? tenantId, Func<AdminDbContext, Task> action)
        {
            using (UsingTenantId(tenantId))
            {
                using (var context = LocalIocManager.Resolve<AdminDbContext>())
                {
                    await action(context);
                    await context.SaveChangesAsync();
                }
            }
        }

        protected T UsingDbContext<T>(int? tenantId, Func<AdminDbContext, T> func)
        {
            T result;

            using (UsingTenantId(tenantId))
            {
                using (var context = LocalIocManager.Resolve<AdminDbContext>())
                {
                    result = func(context);
                    context.SaveChanges();
                }
            }

            return result;
        }

        protected async Task<T> UsingDbContextAsync<T>(int? tenantId, Func<AdminDbContext, Task<T>> func)
        {
            T result;

            using (UsingTenantId(tenantId))
            {
                using (var context = LocalIocManager.Resolve<AdminDbContext>())
                {
                    result = await func(context);
                    await context.SaveChangesAsync();
                }
            }

            return result;
        }

        #region Login

        protected void LoginAsHostAdmin() => LoginAsHost(User.AdminUserName);

        protected void LoginAsDefaultTenantAdmin() => LoginAsTenant(Tenant.DefaultTenantName, User.AdminUserName);

        protected void LoginAsHost(string userName)
        {
            AbpSession.TenantId = null;

            var user = UsingDbContext(context => context.Users.FirstOrDefault(u => u.TenantId == AbpSession.TenantId && u.UserName == userName));
            if (user == null)
            {
                throw new Exception("There is no user: " + userName + " for host.");
            }

            AbpSession.UserId = user.Id;
        }

        protected void LoginAsTenant(string tenancyName, string userName)
        {
            AbpSession.TenantId = null;

            var tenant = UsingDbContext(context => context.Tenants.FirstOrDefault(t => t.TenancyName == tenancyName));
            if (tenant == null)
            {
                throw new Exception("There is no tenant: " + tenancyName);
            }

            AbpSession.TenantId = tenant.Id;

            var user = UsingDbContext(context => context.Users.FirstOrDefault(u => u.TenantId == AbpSession.TenantId && u.UserName == userName));
            if (user == null)
            {
                throw new Exception("There is no user: " + userName + " for tenant: " + tenancyName);
            }

            AbpSession.UserId = user.Id;
        }

        #endregion

        #region GetCurrentUser

        /// <summary>
        /// Gets current user if <see cref="IAbpSession.UserId"/> is not null.
        /// Throws exception if it's null.
        /// </summary>
        protected User GetCurrentUser()
        {
            var userId = AbpSession.GetUserId();
            return UsingDbContext(context => context.Users.Single(u => u.Id == userId));
        }

        /// <summary>
        /// Gets current user if <see cref="IAbpSession.UserId"/> is not null.
        /// Throws exception if it's null.
        /// </summary>
        protected async Task<User> GetCurrentUserAsync()
        {
            var userId = AbpSession.GetUserId();
            return await UsingDbContext(context => context.Users.SingleAsync(u => u.Id == userId));
        }

        #endregion

        #region GetCurrentTenant

        /// <summary>
        /// Gets current tenant if <see cref="IAbpSession.TenantId"/> is not null.
        /// Throws exception if there is no current tenant.
        /// </summary>
        protected Tenant GetCurrentTenant()
        {
            var tenantId = AbpSession.GetTenantId();
            return UsingDbContext(null, context => context.Tenants.Single(t => t.Id == tenantId));
        }

        /// <summary>
        /// Gets current tenant if <see cref="IAbpSession.TenantId"/> is not null.
        /// Throws exception if there is no current tenant.
        /// </summary>
        protected async Task<Tenant> GetCurrentTenantAsync()
        {
            var tenantId = AbpSession.GetTenantId();
            return await UsingDbContext(null, context => context.Tenants.SingleAsync(t => t.Id == tenantId));
        }

        #endregion

        #region GetTenant / GetTenantOrNull

        protected Tenant GetTenant(string tenancyName) => UsingDbContext(null, context => context.Tenants.Single(t => t.TenancyName == tenancyName));

        protected async Task<Tenant> GetTenantAsync(string tenancyName) => await UsingDbContext(null, async context => await context.Tenants.SingleAsync(t => t.TenancyName == tenancyName));

        protected Tenant GetTenantOrNull(string tenancyName) => UsingDbContext(null, context => context.Tenants.FirstOrDefault(t => t.TenancyName == tenancyName));

        protected async Task<Tenant> GetTenantOrNullAsync(string tenancyName) => await UsingDbContext(null, async context => await context.Tenants.FirstOrDefaultAsync(t => t.TenancyName == tenancyName));

        #endregion

        #region GetRole

        protected Role GetRole(string roleName) => UsingDbContext(context => context.Roles.Single(r => r.Name == roleName && r.TenantId == AbpSession.TenantId));

        protected async Task<Role> GetRoleAsync(string roleName) => await UsingDbContext(async context => await context.Roles.SingleAsync(r => r.Name == roleName && r.TenantId == AbpSession.TenantId));

        #endregion

        #region GetUserByUserName

        protected User GetUserByUserName(string userName)
        {
            var user = GetUserByUserNameOrNull(userName);
            if (user == null)
            {
                throw new Exception("Can not find a user with username: " + userName);
            }

            return user;
        }

        protected async Task<User> GetUserByUserNameAsync(string userName)
        {
            var user = await GetUserByUserNameOrNullAsync(userName);
            if (user == null)
            {
                throw new Exception("Can not find a user with username: " + userName);
            }

            return user;
        }

        protected User GetUserByUserNameOrNull(string userName) => UsingDbContext(context =>
                                                                                 context.Users.FirstOrDefault(u =>
                                                                                     u.UserName == userName &&
                                                                                     u.TenantId == AbpSession.TenantId
                                                                                     ));

        protected async Task<User> GetUserByUserNameOrNullAsync(string userName, bool includeRoles = false) => await UsingDbContextAsync(async context =>
                                                                                                                             await context.Users
                                                                                                                                 .IncludeIf(includeRoles, u => u.Roles)
                                                                                                                                 .FirstOrDefaultAsync(u =>
                                                                                                                                         u.UserName == userName &&
                                                                                                                                         u.TenantId == AbpSession.TenantId
                                                                                                                                 ));

        #endregion
    }
}