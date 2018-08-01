﻿using System;
using System.Collections.Generic;
using System.Text;
using Abp.Auditing;
using Abp.Dependency;
using Abp.Extensions;
using Magicodes.Admin.Core.Custom.LogInfos;

namespace Magicodes.Unity.Pay
{
    public class TransactionLogProvider : ITransactionLogProvider, ITransientDependency
    {
        public IClientInfoProvider ClientInfoProvider { get; set; }

        public void Fill(TransactionLog transactionLog, Exception exception = null)
        {
            if (transactionLog.ClientIpAddress.IsNullOrEmpty())
            {
                transactionLog.ClientIpAddress = ClientInfoProvider?.ClientIpAddress;
            }

            if (transactionLog.ClientName.IsNullOrEmpty())
            {
                transactionLog.ClientName = ClientInfoProvider?.ComputerName;
            }

            if (transactionLog.Exception.IsNullOrEmpty())
            {
                transactionLog.Exception = exception?.ToString();
            }

            //根据浏览器请求头判断终端设备
            if (ClientInfoProvider != null && !ClientInfoProvider.BrowserInfo.IsNullOrEmpty())
            {
                var ua = ClientInfoProvider.BrowserInfo;
                if (ua.Contains("iphone;"))
                {
                    transactionLog.Terminal = Terminals.Iphone;
                }
                else if (ua.Contains("ipad;"))
                {
                    transactionLog.Terminal = Terminals.Ipad;
                }
                else if (ua.Contains("Android"))
                {
                    transactionLog.Terminal = Terminals.Android;
                }
                else if (ua.Contains("Mac OS"))
                {
                    transactionLog.Terminal = Terminals.MacOS;
                }
                else if (ua.Contains("Windows NT 5.1") || ua.Contains("Windows NT 5.2"))
                {
                    transactionLog.Terminal = Terminals.WindowsXP;
                }
                else if (ua.Contains("Windows NT 6.0"))
                {
                    transactionLog.Terminal = Terminals.WindowsVista;
                }
                else if (ua.Contains("Windows NT 6.1"))
                {
                    transactionLog.Terminal = Terminals.Windows7;
                }
                else if (ua.Contains("Windows NT 6.2") || ua.Contains("Windows NT 6.3"))
                {
                    transactionLog.Terminal = Terminals.Windows8;
                }
                else if (ua.Contains("Windows NT 10"))
                {
                    transactionLog.Terminal = Terminals.Windows10;
                }
            }
        }
    }
}