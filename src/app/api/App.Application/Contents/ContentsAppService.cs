﻿using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Magicodes.Admin.Attachments;
using Magicodes.Admin.Contents;
using Magicodes.App.Application.Contents.Dto;
using Magicodes.Unity.Editor;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Magicodes.App.Application.Contents
{
    /// <summary>
    /// 内容相关
    /// </summary>
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class ContentsAppService : AppServiceBase, IContentsAppService
    {
        #region 构造函数和成员字段 
        private readonly IRepository<ArticleInfo, long> _articleInfoRepository;
        private readonly IRepository<ColumnInfo, long> _columnInfoRepository;
        private readonly IRepository<ObjectAttachmentInfo, long> _objectAttachmentInfoRepository;
        private readonly EditorHelper _editorHelper;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="articleInfoRepository"></param>
        /// <param name="columnInfoRepository"></param>
        /// <param name="objectAttachmentInfoRepository"></param>
        public ContentsAppService(IRepository<ArticleInfo, long> articleInfoRepository,
                                     IRepository<ColumnInfo, long> columnInfoRepository,
                                     IRepository<ObjectAttachmentInfo, long> objectAttachmentInfoRepository,
                                     EditorHelper editorHelper)
        {
            this._articleInfoRepository = articleInfoRepository;
            this._columnInfoRepository = columnInfoRepository;
            this._objectAttachmentInfoRepository = objectAttachmentInfoRepository;
            this._editorHelper = editorHelper;
        }

        #endregion 

        /// <summary>
        /// 获取轮询图
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        [AbpAllowAnonymous]
        [HttpGet("CarouselPictures")]
        public async Task<List<GetCarouselPictureListDto>> GetCarouselPictureList(GetCarouselPictureListInput input)
        {
            var query = _columnInfoRepository.GetAll().Where(aa => aa.ColumnType == ColumnTypes.Image);

            switch (input.Position)
            {
                case GetCarouselPictureListInput.PositionEnum.Default:
                    query = query.Where(aa => aa.Position == PositionEnum.Default);
                    break;
                    //... ...
            }

            var ltOutput = await (from ci in query
                                  join oa in GetObjectAttachmentInfo(AttachmentObjectTypes.ColumnInfo)
                                    on ci.Id equals oa.ObjectId
                                  select new GetCarouselPictureListDto
                                  {
                                      ImageUrl = oa.AttachmentInfo.Url,
                                      Url = ci.Url
                                  }).ToListAsync();


            return ltOutput;

        }

        /// <summary>
        /// 获取栏目列表接口
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        [AbpAllowAnonymous]
        [HttpGet("ColumnInfo")]
        public async Task<List<GetColumnListDto>> GetColumnList(GetColumnListInput input)
        {
            List<GetColumnListDto> ltOutput = new List<GetColumnListDto>();

            var query = _columnInfoRepository.GetAll();

            switch (input.Position)
            {
                case GetColumnListInput.PositionEnum.Default:
                    query = query.Where(aa => aa.Position == PositionEnum.Default);
                    break;
                    //... ...
            }

            switch (input.ColumnType)
            {
                case GetColumnListInput.ColumnTypeEnum.Html:
                    query = query.Where(aa => aa.ColumnType == ColumnTypes.Html);
                    break;
                case GetColumnListInput.ColumnTypeEnum.Image:
                    query = query.Where(aa => aa.ColumnType == ColumnTypes.Image);
                    break;
            }

            var output = await (from ci in query
                                select new
                                {
                                    ColumnInfoId = ci.Id,
                                    Title = ci.Title,
                                    Introduction = ci.Introduction,
                                    IconCls = ci.IconCls,
                                    Position = ci.Position,
                                    ColumnType = ci.ColumnType,
                                    Code = ci.Code
                                }).ToListAsync();

            ltOutput = output.Select(aa => new GetColumnListDto
            {
                ColumnInfoId = aa.ColumnInfoId,
                Title = aa.Title,
                Introduction = aa.Introduction,
                IconCls = aa.IconCls,
                Position = GetColumnListDtoPosition(aa.Position),
                ColumnType = GetColumnListDtoColumnType(aa.ColumnType),
                Code = aa.Code
            }).ToList();


            GetColumnListDto.PositionEnum GetColumnListDtoPosition(PositionEnum position)
            {
                GetColumnListDto.PositionEnum pe;
                switch (position)
                {
                    case PositionEnum.Default:
                        pe = GetColumnListDto.PositionEnum.Default;
                        break;
                    default:
                        pe = GetColumnListDto.PositionEnum.Default;
                        break;
                }
                return pe;
            }

            GetColumnListDto.ColumnTypeEnum GetColumnListDtoColumnType(ColumnTypes columnType)
            {
                GetColumnListDto.ColumnTypeEnum ct;
                switch (columnType)
                {
                    case ColumnTypes.Image:
                        ct = GetColumnListDto.ColumnTypeEnum.Image;
                        break;
                    case ColumnTypes.Html:
                        ct = GetColumnListDto.ColumnTypeEnum.Html;
                        break;
                    default:
                        ct = GetColumnListDto.ColumnTypeEnum.Html;
                        break;
                }
                return ct;
            }

            return ltOutput;
        }

        /// <summary>
        /// 栏目详情接口
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        [AbpAllowAnonymous]
        [HttpGet("ColumnInfo/{Id}")]
        public async Task<GetColumnDetailInfoOutput> GetColumnDetailInfo(GetColumnDetailInfoInput input)
        {
            var query = _columnInfoRepository.GetAll();
            ColumnInfo columnInfo = null;

            if (input.Id == 0)
            {
                columnInfo = await query.FirstOrDefaultAsync(aa => aa.Code == input.Code);
            }
            else
            {
                columnInfo = await query.FirstOrDefaultAsync(aa => aa.Id == input.Id);
            }

            if (columnInfo != null)
            {
                GetColumnDetailInfoOutput output = new GetColumnDetailInfoOutput
                {
                    ColumnInfoId = columnInfo.Id,
                    Title = columnInfo.Title,
                    Code = columnInfo.Code,
                    Introduction = columnInfo.Introduction,
                    Description = columnInfo.Description,
                    Url = columnInfo.Url,
                    IconCls = columnInfo.Url,
                    ColumnType = GetColumnDetailInfoOutputColumnType(columnInfo.ColumnType),
                    Position = GetColumnDetailInfoOutputPosition(columnInfo.Position)
                };

                GetColumnDetailInfoOutput.PositionEnum GetColumnDetailInfoOutputPosition(PositionEnum position)
                {
                    GetColumnDetailInfoOutput.PositionEnum pe;
                    switch (position)
                    {
                        case PositionEnum.Default:
                            pe = GetColumnDetailInfoOutput.PositionEnum.Default;
                            break;
                        //... ...
                        default:
                            pe = GetColumnDetailInfoOutput.PositionEnum.Default;
                            break;
                    }
                    return pe;
                }

                GetColumnDetailInfoOutput.ColumnTypeEnum GetColumnDetailInfoOutputColumnType(ColumnTypes columnType)
                {
                    GetColumnDetailInfoOutput.ColumnTypeEnum ct;
                    switch (columnType)
                    {
                        case ColumnTypes.Image:
                            ct = GetColumnDetailInfoOutput.ColumnTypeEnum.Image;
                            break;
                        case ColumnTypes.Html:
                            ct = GetColumnDetailInfoOutput.ColumnTypeEnum.Html;
                            break;
                        default:
                            ct = GetColumnDetailInfoOutput.ColumnTypeEnum.Html;
                            break;
                    }
                    return ct;
                }


                return output;
            }
            else
            {
                throw new UserFriendlyException("栏目信息不存在!");
            }
        }

        /// <summary>
        /// 文章列表接口
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        [AbpAllowAnonymous]
        [HttpGet("ArticleInfo")]
        public async Task<PagedResultDto<GetArticleListDto>> GetArticleList(GetArticleListInput input)
        {
            var query = _articleInfoRepository.GetAllIncluding(aa => aa.ColumnInfo, aa => aa.ArticleSourceInfo, aa => aa.ArticleTagInfos);
            if (input.ColumnInfoId.HasValue)
            {
                query = query.Where(aa => aa.ColumnInfoId == input.ColumnInfoId);
            }
            else if (!string.IsNullOrWhiteSpace(input.ColumnInfoCode))
            {
                query = query.Where(aa => aa.ColumnInfo.Code == input.ColumnInfoCode);
            }

            if (!string.IsNullOrWhiteSpace(input.KeyWord))
            {
                query = query.Where(aa => aa.Title.Contains(input.KeyWord) || aa.ColumnInfo.Title.Contains(input.KeyWord));
            }

            if (input.ArticleSourceId.HasValue)
            {
                query = query.Where(aa => aa.ArticleSourceInfoId == input.ArticleSourceId.Value);
            }

            switch (input.RecommendedTypes)
            {
                case GetArticleListInput.RecommendedTypesEnum.Common:
                    query = query.Where(aa => aa.RecommendedType == RecommendedTypes.Common);
                    break;
                case GetArticleListInput.RecommendedTypesEnum.Hot:
                    query = query.Where(aa => aa.RecommendedType == RecommendedTypes.Hot);
                    break;
                case GetArticleListInput.RecommendedTypesEnum.Recommend:
                    query = query.Where(aa => aa.RecommendedType == RecommendedTypes.Recommend);
                    break;
                case GetArticleListInput.RecommendedTypesEnum.Top:
                    query = query.Where(aa => aa.RecommendedType == RecommendedTypes.Top);
                    break;
            }

            var resultCount = query.Count();

            var queryObjectAttach = GetObjectAttachmentInfo(AttachmentObjectTypes.ArticleInfo);

            var data = await (from aa in query
                              join oa in queryObjectAttach
                                    on aa.Id equals oa.ObjectId
                                    into temp
                              from tt in temp.DefaultIfEmpty()
                              select new
                              {
                                  ArticleInfoId = aa.Id,
                                  Title = aa.Title,
                                  Intro = aa.Content.Length > 20 ? $"{aa.Content.Substring(0, 20)}..." : "",
                                  ThumbnailUrl = tt != null ? tt.AttachmentInfo.Url : "",
                                  Publisher = aa.Publisher,
                                  ColumnInfoTitle = aa.ColumnInfo.Title,
                                  ArticleSourceInfoName = aa.ArticleSourceInfo.Name,
                                  RecommendedTypes = aa.RecommendedType,
                                  ReleaseTime = aa.ReleaseTime
                              }).OrderBy(input.Sorting)
                                .PageBy(input)
                                .ToListAsync();

            var output = data.Select(aa => new GetArticleListDto
            {
                ArticleInfoId = aa.ArticleInfoId,
                Title = aa.Title,
                Intro = _editorHelper.ClearHTML(aa.Intro),
                ThumbnailUrl = aa.ThumbnailUrl,
                Publisher = aa.Publisher,
                ColumnInfoTitle = aa.ColumnInfoTitle,
                ArticleSourceInfoName = aa.ArticleSourceInfoName,
                RecommendedTypes = GetArticleListDtoRecType(aa.RecommendedTypes),
                ReleaseTime = aa.ReleaseTime
            }).ToList();

            GetArticleListDto.RecommendedTypesEnum GetArticleListDtoRecType(RecommendedTypes recommendedTypes)
            {
                GetArticleListDto.RecommendedTypesEnum rt;
                switch (recommendedTypes)
                {
                    case RecommendedTypes.Common:
                        rt = GetArticleListDto.RecommendedTypesEnum.Common;
                        break;
                    case RecommendedTypes.Hot:
                        rt = GetArticleListDto.RecommendedTypesEnum.Hot;
                        break;
                    case RecommendedTypes.Recommend:
                        rt = GetArticleListDto.RecommendedTypesEnum.Recommend;
                        break;
                    case RecommendedTypes.Top:
                        rt = GetArticleListDto.RecommendedTypesEnum.Top;
                        break;
                    default:
                        rt = GetArticleListDto.RecommendedTypesEnum.Common;
                        break;
                }
                return rt;
            }

            return new PagedResultDto<GetArticleListDto>(resultCount, output);
        }


        /// <summary>
        /// 文章详情接口
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        [AbpAllowAnonymous]
        [HttpGet("ArticleInfo/{Id}")]
        public async Task<GetArticleDetailInfoOutput> GetArticleDetailInfo(GetArticleDetailInfoInput input)
        {
            ArticleInfo articleInfo;
            if (input.Id == 0)
            {
                articleInfo = await _articleInfoRepository.GetAllIncluding(aa => aa.ColumnInfo, aa => aa.ArticleSourceInfo, aa => aa.ArticleTagInfos)
                                        .FirstOrDefaultAsync(aa => aa.Code == input.Code);
            }
            else
            {
                articleInfo = await _articleInfoRepository.GetAllIncluding(aa => aa.ColumnInfo, aa => aa.ArticleSourceInfo, aa => aa.ArticleTagInfos)
                                                    .FirstOrDefaultAsync(aa => aa.Id == input.Id);
            }
            if (articleInfo != null)
            {
                GetArticleDetailInfoOutput output = new GetArticleDetailInfoOutput
                {
                    ArticleInfoId = articleInfo.Id,
                    Title = articleInfo.Title,
                    Content = articleInfo.Content,
                    Publisher = articleInfo.Publisher,
                    ColumnInfoTitle = articleInfo.ColumnInfo.Title,
                    ArticleSourceInfoName = articleInfo.ArticleSourceInfo.Name,
                    RecommendedTypes = GetArticleDetailInfoOutputRecType(articleInfo.RecommendedType),
                    ReleaseTime = articleInfo.ReleaseTime,
                    ArticleTagInfos = articleInfo.ArticleTagInfos.Select(aa => new GetArticleDetailInfoOutput.ArticleTagInfosDto
                    {
                        ArticleTagInfoId = aa.Id,
                        ArticleTagInfoName = aa.Name
                    }).ToList()
                };

                GetArticleDetailInfoOutput.RecommendedTypesEnum GetArticleDetailInfoOutputRecType(RecommendedTypes recommendedType)
                {
                    GetArticleDetailInfoOutput.RecommendedTypesEnum rt;
                    switch (recommendedType)
                    {
                        case RecommendedTypes.Common:
                            rt = GetArticleDetailInfoOutput.RecommendedTypesEnum.Common;
                            break;
                        case RecommendedTypes.Hot:
                            rt = GetArticleDetailInfoOutput.RecommendedTypesEnum.Hot;
                            break;
                        case RecommendedTypes.Recommend:
                            rt = GetArticleDetailInfoOutput.RecommendedTypesEnum.Recommend;
                            break;
                        case RecommendedTypes.Top:
                            rt = GetArticleDetailInfoOutput.RecommendedTypesEnum.Top;
                            break;
                        default:
                            rt = GetArticleDetailInfoOutput.RecommendedTypesEnum.Common;
                            break;
                    }
                    return rt;
                }

                return output;
            }

            throw new UserFriendlyException("文章详情不存在!");
        }

        private IQueryable<ObjectAttachmentInfo> GetObjectAttachmentInfo(AttachmentObjectTypes type)
        {
            return _objectAttachmentInfoRepository.GetAllIncluding(aa => aa.AttachmentInfo)
                                                    .Where(aa => aa.ObjectType == type);
        }

    }
}