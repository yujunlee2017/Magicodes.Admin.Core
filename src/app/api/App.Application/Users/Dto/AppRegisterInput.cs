﻿using System.ComponentModel.DataAnnotations;

namespace Magicodes.App.Application.Users.Dto
{
    /// <summary>
    ///     注册 输入参数
    /// </summary>
    public class AppRegisterInput
    {
        public enum FromEnum
        {
            /// <summary>
            ///     小程序
            /// </summary>
            WeChatMiniProgram = 0,

            /// <summary>
            ///     微信公众号
            /// </summary>
            WeChat = 1
        }

        /// <summary>
        ///     手机号码
        /// </summary>
        [Required]
        public string Phone { get; set; }

        /// <summary>
        ///     验证码
        /// </summary>
        [Required]
        public string Code { get; set; }

        /// <summary>
        ///     用户OpenId，比如小程序、公众号的Id
        /// </summary>
        [MaxLength(50)]
        public string OpenId { get; set; }

        /// <summary>
        ///     来自
        /// </summary>
        public FromEnum From { get; set; }

        /// <summary>
        ///     用户开放平台Id，比如微信开放平台Id
        /// </summary>
        [MaxLength(50)]
        public string UnionId { get; set; }

        /// <summary>
        ///     姓名
        /// </summary>
        [MaxLength(50)]
        [Required]
        public string TrueName { get; set; }
    }
}