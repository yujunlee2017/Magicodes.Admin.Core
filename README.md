# Magicodes.Admin.Core
### 说明
本框架在ABP和ASP.NET Zero的基础上进行了封装和完善，并且编写了相关的工具、生成模板，目前基于.NET Core 2.0+。

目前本框架已经应用于团队的所有项目，在实际开发过程中还在不断地打磨。

由于本人和团队成员都是利用自己的时间来打磨本框架，因此在大部分情况下，并不会在相关群内进行解答，如果确实是疑难问题，请提交Issue。如果觉得本框架对您有所帮助，请点击Star或者随意打赏。您的支持将鼓励我们继续前行！

**开源和推广的目的主要是觉得ABP设计真心不错，好的框架和理念值得推广，但是实际应用中很容易碰到问题。因此决定在其基础上进行封装和完善，以更易于大家上手和使用。但是奉劝各位，莫做伸手党！维护框架、插件、文档等需要花费本人和团队大量的精力，而出售相关许可也不是我们关心或者侧重的收入来源，因此脑残、小白问题恕不回答。**

目前后台框架已做拆分，前后端分离。后台前端使用TypeScript+AngularJs，通过Web api接口实现后台业务。

### Demo
http://demo.admin.xin-lai.com
账号：Admin
密码：123456abcD

_注意：演示环境不一定是最新代码_
### 主要优势
* 支持跨平台
* 依赖注入
* 分布式支持
* 支持Rest API
* 提供强大的可定制化模板的代码生成
* 单元测试支持
* DDD领域驱动
* Event Bus
* 支持异步后台任务和服务
* 接口文档生成以及配置
* Docker支持
* 支持ORM以及其他主流的数据访问组件
* 第三方登陆、两次验证、单点登录支持
* 导航、设置等支持
* 权限可以控制到API级别
* 支持GZIP动态压缩
* 支持数据筛选器
* 分布式缓存支持
* 异常处理封装
* 基于接口层级的审计日志封装
* 多语言支持
* 多租户支持

### 授权文档下载：
1. [Magicodes.Admin源码基础版授权合同](Magicodes.Admin源码基础版授权合同.doc)
2. [Magicodes.Admin源码高级版授权合同](Magicodes.Admin源码高级版授权合同.doc)

### 推荐开发环境
![推荐开发环境](/documents/Magicodes.Admin推荐开发环境.png)

### 开发文档
1. [框架介绍](documents/教程/1.框架介绍.md)
2. [上手教程](documents/教程/2.上手教程)
3. [数据模型设计与数据迁移](documents/教程/3.数据模型设计与数据迁移.md)

### 生成服务
 高级版附送代码生成工具以及相关源代码。

 #### 后台前端生成
 1. 路由规则
 2. 组件注册
 3. 菜单项
 4. 创建或编辑模型
	支持控件类型自动生成（可以通过特性修改）：
	1） 复选框
	2） 文本框
	3） 金额
	4） 密码
	5） 邮件
	6） 多文本框
	7） 时间+日期
	8） 时间
	9） 日期
	10）Html
	11）数值
	12）小数
	13）外键下拉选择（即将支持）
5. 列表页
	1）添加和修改
	2）删除
	3）导出
	4）查询（时间段以及关键字查询）
6. 多语言

#### 后台服务生成
1. 语言配置
2. 增删改查以及导出API
3. Dto
4. 权限Key以及配置


#### 接口定义生成以及单元测试和Postman文件生成
1. 接口定义和实现生成（入参Dto、出参Dto、验证、权限、分页、排序、要点以及API注释），支持枚举和子参数
2. 接口单元测试、测试数据以及要点生成
3. PostMan接口文件生成，支持分组、变量设置等

#### 接口文档生成与配置
1. APP接口文档生成
2. 后台接口文档生成
3. 支持接口隐藏配置

### 官方博客
http://www.cnblogs.com/codelove/

### 官方网址
http://xin-lai.com

### 其他开源库地址
https://github.com/xin-lai

### 相关QQ群
    85318032（.NET 交流群1）
    490755124 （长沙.NET 交流群）

### 小店地址
https://shop113059108.taobao.com/