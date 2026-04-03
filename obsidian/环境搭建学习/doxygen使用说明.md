# 前言

最近在工作的时候经常需要打包库，提供给到客户使用，在打包的过程中需要编写接口使用文档，之前都是自己一个接口一个接口重新编写的使用说明，感觉十分麻烦。在一次开会交流的时候，一个大佬推荐了我使用doxygen这个软件，仔细研究了一下发现，需要芯片厂，例如TI、ST等他们的使用文档都是通过这种方式来生成的，于是研究并学习了一下。

# 1.安装软件

**1.Doxygen**

Doxygen能将程序中的特定批注转换成为说明文件。它可以依据程序本身的结构，将程序中按规范注释的批注经过处理生成一个纯粹的参考手册，通过提取代码结构或借助自动生成的包含依赖图（include dependency graphs）、继承图（inheritance diagram）以及协作图（collaboration diagram）来可视化文档之间的关系， Doxygen生成的帮助文档的格式可以是CHM、RTF、PostScript、PDF、HTML等。

**2.graphviz**

Graphviz(Graph Visualization Software)是一个由AT&T实验室启动的开源工具包,用于绘制DOT语言脚本描述的图形。要使用Doxygen生成依赖图、继承图以及协作图，必须先安装graphviz软件。

**3.HTML Help WorkShop**

微软出品的HTML Help WorkShop是制作CHM文件的最佳工具，它能将HTML文件编译生成CHM文档。Doxygen软件默认生成HTML文件或Latex文件，我们要通过HTML生成CHM文档，需要先安装HTML Help WorkShop软件，并在Doxygen中进行关联。

软件安装都选择默认方式，点击下一步直至安装完成。安装完后进行Doxygen配置时需要关联graphviz和HTML Help WorkShop的安装路径。

# 2.注释插件配置

要生成相对应的接口说明文档就必须要按照官方标准的模板，编写注释。这里提供vscode的一个注释插件，能够快速生成注释标准模块。

在vscode插件市场找到Doxygen Documentation generation插件

![Doxygen_Documentation_generation插件](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/Doxygen_Documentation_generation%E6%8F%92%E4%BB%B6.png)

安装完成后，查看官方文档说明：

```json
  // The prefix that is used for each comment line except for first and last.
  "doxdocgen.c.commentPrefix": " * ",

  // Smart text snippet for factory methods/functions.
  "doxdocgen.c.factoryMethodText": "Create a {name} object",

  // The first line of the comment that gets generated. If empty it won't get generated at all.
  "doxdocgen.c.firstLine": "/**",

  // Smart text snippet for getters.
  "doxdocgen.c.getterText": "Get the {name} object",

  // The last line of the comment that gets generated. If empty it won't get generated at all.
  "doxdocgen.c.lastLine": " */",

  // Smart text snippet for setters.
  "doxdocgen.c.setterText": "Set the {name} object",

  // Doxygen comment trigger. This character sequence triggers generation of Doxygen comments.
  "doxdocgen.c.triggerSequence": "/**",

  // Smart text snippet for constructors.
  "doxdocgen.cpp.ctorText": "Construct a new {name} object",

  // Smart text snippet for destructors.
  "doxdocgen.cpp.dtorText": "Destroy the {name} object",

  // The template of the template parameter Doxygen line(s) that are generated. If empty it won't get generated at all.
  "doxdocgen.cpp.tparamTemplate": "@tparam {param} ",

  // File copyright documentation tag.  Array of strings will be converted to one line per element.  Can template {year}.
  "doxdocgen.file.copyrightTag": [
    "@copyright Copyright (c) {year}"
  ],

  // Additional file documentation. One tag per line will be added. Can template `{year}`, `{date}`, `{author}`, `{email}` and `{file}`. You have to specify the prefix.
  "doxdocgen.file.customTag": [],

  // The order to use for the file comment. Values can be used multiple times. Valid values are shown in default setting.
  "doxdocgen.file.fileOrder": [
    "file",
    "author",
    "brief",
    "version",
    "date",
    "empty",
    "copyright",
    "empty",
    "custom"
  ],

  // The template for the file parameter in Doxygen.
  "doxdocgen.file.fileTemplate": "@file {name}",

  // Version number for the file.
  "doxdocgen.file.versionTag": "@version 0.1",

  // Set the e-mail address of the author.  Replaces {email}.
  "doxdocgen.generic.authorEmail": "you@domain.com",

  // Set the name of the author.  Replaces {author}.
  "doxdocgen.generic.authorName": "your name",

  // Set the style of the author tag and your name.  Can template {author} and {email}.
  "doxdocgen.generic.authorTag": "@author {author} ({email})",

  // If this is enabled a bool return value will be split into true and false return param.
  "doxdocgen.generic.boolReturnsTrueFalse": true,

  // The template of the brief Doxygen line that is generated. If empty it won't get generated at all.
  "doxdocgen.generic.briefTemplate": "@brief {text}",

  // The format to use for the date.
  "doxdocgen.generic.dateFormat": "YYYY-MM-DD",

  // The template for the date parameter in Doxygen.
  "doxdocgen.generic.dateTemplate": "@date {date}",

  // Decide if you want to get smart text for certain commands.
  "doxdocgen.generic.generateSmartText": true,

  // Whether include type information at return.
  "doxdocgen.generic.includeTypeAtReturn": true,

  // How many lines the plugin should look for to find the end of the declaration. Please be aware that setting this value too low could improve the speed of comment generation by a very slim margin but the plugin also may not correctly detect all declarations or definitions anymore.
  "doxdocgen.generic.linesToGet": 20,

  // The order to use for the comment generation. Values can be used multiple times. Valid values are shown in default setting.
  "doxdocgen.generic.order": [
    "brief",
    "empty",
    "tparam",
    "param",
    "return",
    "custom",
    "version",
    "author",
    "date",
    "copyright"
  ],

  // Custom tags to be added to the generic order. One tag per line will be added. Can template `{year}`, `{date}`, `{author}`, `{email}` and `{file}`. You have to specify the prefix.
  "doxdocgen.generic.customTags": [],

  // The template of the param Doxygen line(s) that are generated. If empty it won't get generated at all.
  "doxdocgen.generic.paramTemplate": "@param {param} ",

  // The template of the return Doxygen line that is generated. If empty it won't get generated at all.
  "doxdocgen.generic.returnTemplate": "@return {type} ",

  // Decide if the values put into {name} should be split according to their casing.
  "doxdocgen.generic.splitCasingSmartText": true,

  // Array of keywords that should be removed from the input prior to parsing.
  "doxdocgen.generic.filteredKeywords": [],

  // Substitute {author} with git config --get user.name.
  "doxdocgen.generic.useGitUserName": false,

  // Substitute {email} with git config --get user.email.
  "doxdocgen.generic.useGitUserEmail": false

  // Provide intellisense and snippet for doxygen commands
  "doxdocgen.generic.commandSuggestion": true

  // Add `\\` in doxygen command suggestion for better readbility (need to enable commandSuggestion)
  "doxdocgen.generic.commandSuggestionAddPrefix": false
```

输入`/**`加回车即可自动生成注释

![Doxygen_Documentation_generation插件演示](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/Doxygen_Documentation_generation%E6%8F%92%E4%BB%B6%E6%BC%94%E7%A4%BA.gif)

这里提供一个较为简介好看的模板配置

```json
    // Doxygen documentation generator set

    // File copyright documentation tag.  Array of strings will be converted to one line per element.  Can template {year}.
    "doxdocgen.file.copyrightTag": [
        "@copyright {indent:18} : {indent:2} Copyright (c) {year} by chipsea, All Rights Reserved."
    ],

    // The order to use for the file comment. Values can be used multiple times. Valid values are shown in default setting.
    "doxdocgen.file.fileOrder": [
        "file",
        "brief",
        "detail",
        "author",
        "version",
        "date",
        "copyright"
    ],

    // The template for the file parameter in Doxygen.
    "doxdocgen.file.fileTemplate": "@file {indent:18} : {indent:2} {name}",

    // The template of the brief Doxygen line that is generated. If empty it won't get generated at all.
    "doxdocgen.generic.briefTemplate": "@brief {indent:18} {text}",

    // Version number for the file.
    "doxdocgen.file.versionTag": "@version {indent:18} : {indent:2} beta V0.1",

    // Set the e-mail address of the author.  Replaces {email}.
    "doxdocgen.generic.authorEmail": "794002197@qq.com",

    // Set the name of the author.  Replaces {author}.
    "doxdocgen.generic.authorName": "tangwc",

    // Set the style of the author tag and your name.  Can template {author} and {email}.
    "doxdocgen.generic.authorTag": "@author {indent:18} : {indent:2} {author} ({email})",

    // The format to use for the date.
    "doxdocgen.generic.dateFormat": "YYYY-MM-DD",

    // The template for the date parameter in Doxygen.
    "doxdocgen.generic.dateTemplate": "@date {indent:18} : {indent:2} {date}",

    // The order to use for the comment generation. Values can be used multiple times. Valid values are shown in default setting.
    "doxdocgen.generic.order": [
        "brief",
        "param",
        "tparam",
        "return",
        "retval"
    ],
    // The template of the param Doxygen line(s) that are generated. If empty it won't get generated at all.
    "doxdocgen.generic.paramTemplate": "@param[in] {indent:18} {param}",

    // The template of the return Doxygen line that is generated. If empty it won't get generated at all.
    "doxdocgen.generic.returnTemplate": "@return[out] {indent:18} {type}",

    // If this is enabled a bool return value will be split into true and false return param.
    "doxdocgen.generic.boolReturnsTrueFalse": true,

    // Whether include type information at return.
    "doxdocgen.generic.includeTypeAtReturn": true,
```

# 3.Doxygen语法简介

## 1.特殊命令简介

| 命令        | 字段名                                                       | 语法                                                      |
| ----------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| @file       | 文件名                                                       | file [< name >]                                           |
| @brief      | 简介                                                         | brief { brief description }                               |
| @author     | 作者                                                         | author { list of authors }                                |
| @mainpage   | 主页信息                                                     | mainpage [(title)]                                        |
| @date       | 年-月-日                                                     | date { date description }                                 |
| @author     | 版本号                                                       | version { version number }                                |
| @copyright  | 版权                                                         | copyright { copyright description }                       |
| @param      | 参数                                                         | param [(dir)] < parameter-name> { parameter description } |
| @return     | 返回                                                         | return { description of the return value }                |
| @retval     | 返回值                                                       | retval { description }                                    |
| @bug        | 漏洞                                                         | bug { bug description }                                   |
| @details    | 细节                                                         | details { detailed description }                          |
| @pre        | 前提条件                                                     | pre { description of the precondition }                   |
| @see        | 参考                                                         | see { references }                                        |
| @link       | 连接(与@see类库，{@link [http://www.google.com](https://link.zhihu.com/?target=http%3A//www.google.com)}) | link < link-object>                                       |
| @throw      | 异常描述                                                     | throw < exception-object> { exception description }       |
| @todo       | 待处理                                                       | todo { paragraph describing what is to be done }          |
| @warning    | 警告信息                                                     | warning { warning message }                               |
| @deprecated | 弃用说明。可用于描述替代方案，预期寿命等                     | deprecated { description }                                |
| @example    | 弃用说明。可用于描述替代方案，预期寿命等                     | deprecated { description }                                |

## 2.文件注释

一般放在文件开头

```c
/**
 * @file 文件名
 * @brief 简介
 * @details 细节
 * @author 作者
 * @version 版本号
 * @date 年-月-日
 * @copyright 版权
 */
```

## 3.结构体，变量注释

### 结构体注释

```c
/**
 * @brief 详细描述
 */
```

### 结构体里变量或变量/常量注释

结构体了变量也可以像这样注释

```c
//定义一个整型变量a
int a;

/**
 * @brief 定义一个整型变量a
*/
int a;

int a; /*!< 定义一个整型变量a */
int a; /**< 定义一个整型变量a */
int a; //!< 定义一个整型变量a
int a; ///< 定义一个整型变量a
```

### 函数注释

```c
/**
  * @brief 函数描述
  * @param 参数描述
  * @return 返回描述
  * @retval 返回值描述
  */
```

### 特殊语法说明

#### 1.换行

在doxygen中注释换行必须手动添加：

![doxygen说明](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E8%AF%B4%E6%98%8E1.png)

如图添加后生成的：

![doxygen说明](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E8%AF%B4%E6%98%8E2.png)

#### 2.多返回值多次添加

![doxygen说明](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E8%AF%B4%E6%98%8E3.png)

效果：

![doxygen说明](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E8%AF%B4%E6%98%8E4.png)

#### 3.表格

对于一些变量利用表格说明更加直观有些，这里可以采用跟markdown语法相同的效果画表格

![doxygen说明](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E8%AF%B4%E6%98%8E5.png)

效果：

![doxygen说明](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E8%AF%B4%E6%98%8E6.png)

# 4.doxygen配置说明

根据上方写好了软件注释后，就可以打开安装好的Doxywizard软件。

打开后界面如下：

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE1.png)

### 使用流程

1.选择运行doxygen的工作目录，一般是代码在那里就定位到那个文件夹。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE2.png)

2.接着填写一些生成文档信息，包括文档名称、简介、版本、源代码路径、生成文档路径。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE3.png)

> 注意：这里源代码路径和生成文档路径建议使用相对路径，只要确定了工作区就可以。
>
> 当有多个源代码路径话，这里可以先不添加，可以在后面详细配置部分增加

3.选择编程语言对应的最优结果，按照编程语言选择

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE4.png)

4.选择输出格式，默认可以生成html和tatex格式的，后可以通过htmlhelp转成chm，先要选择html生成后才能选择chm。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE5.png)

5.选择dot tool，可以通过GraphViz来作图。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE6.png)

这样选择run就可以生成一个文档了。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE7.png)

### 进阶配置

这样生成以后部分界面不太美观，这里可以通过详细设置来优化。

1.设置中文

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE8.png)

2.代码风格 如果勾选了，在这两种风格下默认第一行为简单说明，以第一个句号为分隔；如果不选，则需要按照Doxygen的指令@brief来进行标准注释。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE9.png)

3.生成所有变量和函数

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE10.png)

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE11.png)

4.增加输入路径和选择输入编码

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE12.png)

5.设置HTMLHELP项，输入生成CHM名称，在HHC_LOCATION中填入HTMLHELP WORKSHOP安装目录中hhc.exe的路径，将chm编码方式改为GBK方式。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE13.png)

6.在Dot_PATH中填写GraphViz的安装路径。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE14.png)

7.设置预编译宏文件路径。

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE15.png)

设置完成后可以选择将配置文件保存为cfg文件，后续只需要打开相应的配置文件即可直接使用

![doxygen配置](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/doxygen%E9%85%8D%E7%BD%AE16.png)

