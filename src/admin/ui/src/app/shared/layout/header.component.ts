import { Injector, ElementRef, Component, OnInit, AfterViewInit, ViewChild, ViewEncapsulation, Inject } from '@angular/core';

import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';
import { UserNotificationHelper } from '@app/shared/layout/notifications/UserNotificationHelper';
import { NotificationSettingsModalComponent } from '@app/shared/layout/notifications/notification-settings-modal.component';
import { AppConsts } from '@shared/AppConsts';
import { EditionPaymentType, SubscriptionStartType } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ChangeUserLanguageDto, GetCurrentLoginInformationsOutput, LinkedUserDto, ProfileServiceProxy, SessionServiceProxy, TenantLoginInfoDto, UserLinkServiceProxy, UserServiceProxy } from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';
import * as moment from 'moment';
import { LinkedAccountsModalComponent } from './linked-accounts-modal.component';
import { LoginAttemptsModalComponent } from './login-attempts-modal.component';
import { ChangePasswordModalComponent } from './profile/change-password-modal.component';
import { ChangeProfilePictureModalComponent } from './profile/change-profile-picture-modal.component';
import { MySettingsModalComponent } from './profile/my-settings-modal.component';

import { DOCUMENT } from '@angular/common';
import { LayoutRefService } from '@metronic/app/core/services/layout/layout-ref.service';

@Component({
    templateUrl: './header.component.html',
    selector: 'header-bar',
    encapsulation: ViewEncapsulation.None
})
export class HeaderComponent extends AppComponentBase implements OnInit, AfterViewInit {

    @ViewChild('notificationSettingsModal') notificationSettingsModal: NotificationSettingsModalComponent;

    @ViewChild('loginAttemptsModal') loginAttemptsModal: LoginAttemptsModalComponent;
    @ViewChild('linkedAccountsModal') linkedAccountsModal: LinkedAccountsModalComponent;
    @ViewChild('changePasswordModal') changePasswordModal: ChangePasswordModalComponent;
    @ViewChild('changeProfilePictureModal') changeProfilePictureModal: ChangeProfilePictureModalComponent;
    @ViewChild('mySettingsModal') mySettingsModal: MySettingsModalComponent;

    @ViewChild('mHeader') mHeader: ElementRef;

    languages: abp.localization.ILanguageInfo[];
    currentLanguage: abp.localization.ILanguageInfo;
    isImpersonatedLogin = false;
    isMultiTenancyEnabled = false;

    shownLoginNameTitle = '';
    shownLoginName = '';

    tenancyName = '';
    userName = '';

    profilePicture = AppConsts.appBaseUrl + '/assets/common/images/default-profile-picture.png';
    defaultLogo = AppConsts.appBaseUrl + '/assets/common/images/app-logo-on-' + this.ui.getAsideSkin() + '.png';
    recentlyLinkedUsers: LinkedUserDto[];
    unreadChatMessageCount = 0;

    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;

    chatConnected = false;

    tenant: TenantLoginInfoDto = new TenantLoginInfoDto();
    subscriptionStartType = SubscriptionStartType;
    editionPaymentType: typeof EditionPaymentType = EditionPaymentType;

    constructor(
        injector: Injector,
        private _abpSessionService: AbpSessionService,
        private _abpMultiTenancyService: AbpMultiTenancyService,
        private _profileServiceProxy: ProfileServiceProxy,
        private _userLinkServiceProxy: UserLinkServiceProxy,
        private _userServiceProxy: UserServiceProxy,
        private _authService: AppAuthService,
        private _impersonationService: ImpersonationService,
        private _linkedAccountService: LinkedAccountService,
        private _userNotificationHelper: UserNotificationHelper,
        private _sessionService: SessionServiceProxy,
        private layoutRefService: LayoutRefService,
        @Inject(DOCUMENT) private document: Document
    ) {
        super(injector);
    }

    get multiTenancySideIsTenant(): boolean {
        return this._abpSessionService.tenantId > 0;
    }

    ngOnInit() {
        this.isMultiTenancyEnabled = this._abpMultiTenancyService.isEnabled;
        this._userNotificationHelper.settingsModal = this.notificationSettingsModal;

        this.languages = _.filter(this.localization.languages, l => (<any>l).isDisabled === false);

        this.currentLanguage = this.localization.currentLanguage;
        this.isImpersonatedLogin = this._abpSessionService.impersonatorUserId > 0;

        this.shownLoginNameTitle = this.isImpersonatedLogin ? this.l('YouCanBackToYourAccount') : '';
        this.setCurrentLoginInformations();
        this.getProfilePicture();
        this.getRecentlyLinkedUsers();

        this.registerToEvents();
    }

    ngAfterViewInit(): void {
        this.layoutRefService.addElement('header', this.mHeader.nativeElement);
    }

    registerToEvents() {
        abp.event.on('profilePictureChanged', () => {
            this.getProfilePicture();
        });

        abp.event.on('app.chat.unreadMessageCountChanged', messageCount => {
            this.unreadChatMessageCount = messageCount;
        });

        abp.event.on('app.chat.connected', () => {
            this.chatConnected = true;
        });
    }

    changeLanguage(languageName: string): void {
        const input = new ChangeUserLanguageDto();
        input.languageName = languageName;

        this._profileServiceProxy.changeLanguage(input).subscribe(() => {
            abp.utils.setCookieValue(
                'Abp.Localization.CultureName',
                languageName,
                new Date(new Date().getTime() + 5 * 365 * 86400000), //5 year
                abp.appPath
            );

            window.location.reload();
        });
    }

    setCurrentLoginInformations(): void {
        this.shownLoginName = this.appSession.getShownLoginName();
        this.tenancyName = this.appSession.tenancyName;
        this.userName = this.appSession.user.userName;
        this.tenant = this.appSession.tenant;
    }

    getShownUserName(linkedUser: LinkedUserDto): string {
        if (!this._abpMultiTenancyService.isEnabled) {
            return linkedUser.username;
        }

        return (linkedUser.tenantId ? linkedUser.tenancyName : '.') + '\\' + linkedUser.username;
    }

    getProfilePicture(): void {
        this._profileServiceProxy.getProfilePicture().subscribe(result => {
            if (result && result.profilePicture) {
                this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
            }
        });
    }

    getRecentlyLinkedUsers(): void {
        this._userLinkServiceProxy.getRecentlyUsedLinkedUsers().subscribe(result => {
            this.recentlyLinkedUsers = result.items;
        });
    }

    showLoginAttempts(): void {
        this.loginAttemptsModal.show();
    }

    showLinkedAccounts(): void {
        this.linkedAccountsModal.show();
    }

    changePassword(): void {
        this.changePasswordModal.show();
    }

    changeProfilePicture(): void {
        this.changeProfilePictureModal.show();
    }

    changeMySettings(): void {
        this.mySettingsModal.show();
    }

    logout(): void {
        this._authService.logout();
    }

    onMySettingsModalSaved(): void {
        this.shownLoginName = this.appSession.getShownLoginName();
    }

    backToMyAccount(): void {
        this._impersonationService.backToImpersonator();
    }

    switchToLinkedUser(linkedUser: LinkedUserDto): void {
        this._linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    get chatEnabled(): boolean {
        return (!this._abpSessionService.tenantId || this.feature.isEnabled('App.ChatFeature'));
    }

    subscriptionStatusBarVisible(): boolean {
        return this.appSession.tenantId > 0 && (this.appSession.tenant.isInTrialPeriod || this.subscriptionIsExpiringSoon());
    }

    subscriptionIsExpiringSoon(): boolean {
        if (this.appSession.tenant.subscriptionEndDateUtc) {
            return moment().utc().add(AppConsts.subscriptionExpireNootifyDayCount, 'days') >= moment(this.appSession.tenant.subscriptionEndDateUtc);
        }

        return false;
    }

    getSubscriptionExpiringDayCount(): number {
        if (!this.appSession.tenant.subscriptionEndDateUtc) {
            return 0;
        }

        return Math.round(moment.utc(this.appSession.tenant.subscriptionEndDateUtc).diff(moment().utc(), 'days', true));
    }

    getTrialSubscriptionNotification(): string {
        return this.l('TrialSubscriptionNotification',
            '<strong>' + this.appSession.tenant.edition.displayName + '</strong>',
            '<a href=\'/account/buy?editionId=' + this.appSession.tenant.edition.id + '&editionPaymentType=' + this.editionPaymentType.BuyNow + '\'>' + this.l('ClickHere') + '</a>');
    }

    getExpireNotification(localizationKey: string): string {
        return this.l(localizationKey, this.getSubscriptionExpiringDayCount());
    }

    clickTopbarToggle(event: Event): void {
        this.document.body.classList.toggle('m-topbar--on');
    }

    downloadCollectedData(): void {
        this._profileServiceProxy.prepareCollectedData().subscribe(() => {
            this.message.success(this.l('GdprDataPrepareStartedNotification'));
        });
    }
}
