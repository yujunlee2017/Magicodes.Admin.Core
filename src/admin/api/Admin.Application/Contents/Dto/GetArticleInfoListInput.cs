﻿using System;
using Abp.Extensions;
using Abp.Runtime.Validation;
using Magicodes.Admin.Dto;

namespace Magicodes.Admin.Contents.Dto
{
    /// <summary>
    ///  文章搜索参数
    /// </summary>
    public partial class GetArticleInfosInput : PagedAndSortedInputDto, IShouldNormalize
    {
        /// <summary>
        /// 是否仅获取回收站数据
        /// </summary>
		public bool IsOnlyGetRecycleData { get; set; }

        /// <summary>
        /// 栏目ID
        /// </summary>
        public long? ColumnId { get; set; }


        /// <summary>
        /// 创建开始时间
        /// </summary>
        public DateTime? CreationDateStart { get; set; }
        
		/// <summary>
		/// 创建结束时间
		/// </summary>
        public DateTime? CreationDateEnd { get; set; }
				
		/// <summary>
		/// 修改开始时间
		/// </summary>
        public DateTime? ModificationTimeStart { get; set; }
        
		/// <summary>
		/// 修改结束时间
		/// </summary>
        public DateTime? ModificationTimeEnd { get; set; }

		
		/// <summary>
		/// 关键字
		/// </summary>
		public string Filter { get; set; }

        public void Normalize()
        {
            if (Sorting.IsNullOrWhiteSpace())
            {
		
				Sorting = "CreationTime DESC";

		
            }
        }
    }
		
}