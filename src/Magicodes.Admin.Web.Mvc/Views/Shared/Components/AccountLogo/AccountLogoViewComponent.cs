﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Configuration.Startup;
using Microsoft.AspNetCore.Mvc;
using Magicodes.Admin.Web.Session;

namespace Magicodes.Admin.Web.Views.Shared.Components.AccountLogo
{
    public class AccountLogoViewComponent : ViewComponent
    {
        private readonly IPerRequestSessionCache _sessionCache;

        public AccountLogoViewComponent(IPerRequestSessionCache sessionCache)
        {
            _sessionCache = sessionCache;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            var loginInfo = await _sessionCache.GetCurrentLoginInformationsAsync();
            return View(new AccountLogoViewModel(loginInfo));
        }
    }
}