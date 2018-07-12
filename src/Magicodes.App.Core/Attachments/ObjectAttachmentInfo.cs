﻿using Abp.Domain.Entities;

namespace Magicodes.App.Core.Attachments
{
    /// <summary>
    /// 
    /// </summary>
    public class ObjectAttachmentInfo : Entity<long>
    {
        /// <summary>
        /// 对象Id
        /// </summary>
        public long ObjectId { get; set; }

        /// <summary>
        /// 附件Id
        /// </summary>
        public long AttachmentInfoId { get; set; }

        /// <summary>
        /// 附件信息
        /// </summary>
        public  virtual AttachmentInfo AttachmentInfo { get; set; }

        /// <summary>
        /// 对象类型
        /// </summary>
        public AttachmentObjectTypes ObjectType { get; set; }
    }
}
