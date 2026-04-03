# 前言

在日常移植算法的过程中，由于**Microsoft Visual Studio**无法安装，导致需要自己搭建个C语言开发环境。

最开始使用**VScode**上的通过C/C++直接编译，虽然简单方便，但对于多文件，多路径下的，则需要编写task.json文件编译C文件，增加一个文件，就需要写入编译，过于麻烦。

后使用**小熊猫C++**，虽然集成化的IDE，能够自动生成makefile文件，但还是需要手动添加编译文件，且软件不易阅读代码。

现在选择使用的是VScode+Cmake。接下来对于Cmake相关使用和应用展开说明。

# ① Make与CMake

首先先来了解一下gcc，gcc是GNU Compiler Collection(就是GNU编译器套件)，也可以简单认为是编译器，它可以编译很多种编程语言(包括C、C++、Objective-C、Fortran、Java等等)。当我们的程序只有一个源文件时，直接就可以用gcc命令编译它。

但是当程序包含很多源文件时，用gcc命令逐个去编译时，就很容易混乱而且工作量大。所以就出现了Make工具。它是一个自动化编译工具，我们可以使用一条命令实现完全编译，但是需要编写一个规则文件，Make工具依据它来批量处理编译，这个文件就是Makefile文件。Makefile在一些简单的工程完全可以人工手写，但是当工程非常大的时候，手写Makefile也是非常麻烦的，如果换了个平台Makefile又要重新修改。（win下和linux下makefile语法有部分不同）

这个时候出现了CMake这个工具，CMake能够输出各种各样的Makefile或者project文件，从而帮助程序员减轻负担。但是随着而来的也是需要编写CMakeLists文件。当然CMake还有其他功能，就是可以跨平台生成对应能用的Makefile，我们不需要自己再去修改。

![cmake编译流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/cmake编译流程.png)

# ② 利用VScode搭建Cmake开发环境

## 1.MSYS2安装

[官网下载](https://www.msys2.org/#installation)
[国内镜像下载](https://mirrors.tuna.tsinghua.edu.cn/help/msys2/)

双击打开 msys2-x86_64-20221028.exe

直接一路安装就可以了

## 2.配置环境

### 1.添加环境变量

打开环境变量

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B12.png)

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B2.png)
![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B3.png)

根据自己的**MSYS2**安装路径修改

### 2.配置MSYS2环境

从“开始”菜单栏中找到“**MSYS2 MSYS**"并运行

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B4.png)

```powershell
#下面几条命令为安装必要插件
pacman -Syu
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-gdb mingw-w64-x86_64-cmake mingw-w64-x86_64-make
pacman -S mingw-w64-x86_64-toolchain
pacman -S mingw-w64-x86_64-clang
pacman -S mingw-w64-x86_64-yasm mingw-w64-x86_64-nasm
pacman -S mingw-w64-x86_64-freetype
#下面几条命令根据需求来，装自己想要的
pacman -S mingw-w64-x86_64-opencv
pacman -S mingw-w64-x86_64-ffmpeg mingw-w64-x86_64-ffms2
pacman -S mingw-w64-x86_64-libwebsockets
...
```

在安装过程中如遇以下提示，按下回车全部安装

```powershell
Enter a selection (default=all):
```

在安装过程中如遇以下提示，输入“Y”选择继续安装

```powershell
:: Proceed with installation? [Y/n]
```

验证环境：

`win+R`打开运行 输入CMD 确定

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B5.png)

输入

```cmd
cmake  --version
```

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B6.png)

环境安装完成

### 3.配置VScode

安装**CMake Tools**扩展

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B7.png)

在扩展设置中配置以下选项：

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B8.png)

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B9.png)

与**MSYS2**安装目录一致

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B10.png)

重启VSCode，会自动启动cmake（如果没有，按下**Ctrl+Shift+P**，输入**CMake: configure**）

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B11.png)

不想自动启动可以选择扩展设置里关闭

![camke设置流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/camke%E8%AE%BE%E7%BD%AE%E6%B5%81%E7%A8%8B12.png)

至此，环境搭建已经完成.

# ③ Cmake简单语法介绍

```cmake
cmake_minimum_required(VERSION 3.19)#选择最低版本
project(HR_C VERSION 0.1.0)#工程名称

message("-- " ${PROJECT_NAME} " " ${CMAKE_CXX_COMPILER})#类似于 log

set(CMAKE_CXX_STANDARD 11) #选择c++版本 c++ 11

add_executable(HR_C "") # 添加可执行文件
#添加头文件目录，相当于把路径添加到环境变量中。
target_include_directories(HR_C PUBLIC ./algorithm ./)

file(GLOB SRCS CONFIGURE_DEPENDS *.cpp ./algorithm/*.c)
file(GLOB HEAD CONFIGURE_DEPENDS *.h ./algorithm/*.h)
#message(${SRCS})
#message(${HEAD})
#C++的源文件指定为Private，是因为源文件只是在构建库文件是使用，头文件指定为Public是因为构建和编译时都会使用。
target_sources(HR_C PRIVATE ${SRCS} PUBLIC ${HEAD})
```

**文件目录结构如下：**

```powershell
├─.idea					// clion 配置
├─.vscode			   // vscode 配置	
├─build				  // cmake默认生成输出			
├─cmake-build-debug  // clion生成的输出文件
└─algorithm
│      cs_heart.c
│      cs_heart.h
│      cs_log.c
│      cs_log.h
│      HR_data_process.c
│      HR_data_process.h
│      types.h
│  .gitignore
│  CMakeLists.txt
│  filehandler.cpp
│  filehandler.h
│  main.cpp
│  ppg_case_handler.cpp
│  ppg_case_handler.h
│  ppg_csv_reader.h
```

**这里举例一个路径复杂的工程：lvgl的window模拟器CMakeLists.txt：**

详细工程可以参考我的开源的一个项目：[LVGL_Simulation](https://gitee.com/zhong_li/lvgl-simulation)里面VScode文件工程 即采用如下编写。

```cmake
cmake_minimum_required(VERSION 3.25)
project(LVGL)

#  SET(CMAKE_C_COMPILER "D:/ProgramFiles/LLVM/x86/bin/clang.exe")
#  SET(CMAKE_CXX_COMPILER "D:/ProgramFiles/LLVM/x86/bin/clang++.exe")

message("-- " ${PROJECT_NAME} " " ${CMAKE_CXX_COMPILER})

set(CMAKE_CXX_STANDARD 20) #1

file(GLOB_RECURSE HEADERS lv_examples/*.h lv_drivers/*.h lvgl/*.h lv_conf.h lv_ex_conf.h lv_drv_conf.h)
file(GLOB_RECURSE SOURCES lv_examples/*.c lv_drivers/*.c lvgl/*.c main/*.c)
include_directories(.  ./lvgl sdl2/include)
link_directories(sdl2/lib)
#message(${HEADERS})
#message(${SOURCES})
add_executable(LVGL  ${HEADERS} ${SOURCES})

target_link_libraries(LVGL libSDL2)
```

# 后记

以前都是使用集成化的IDE，导致突然要使用编辑一个简单的代码反而没办法编译了，采用这种方式后反而有利于跨平台使用，也更加深入的了解了代码是如何编译的。

参考文章：

* [LVGL学习笔记|Windows环境下模拟LittlevGL：VSCode+MSYS2+Cmake搭建模拟环境](https://blog.csdn.net/m0_47090309/article/details/125552817)
* [Make与CMake_cmake make_伴君的博客-CSDN博客](https://blog.csdn.net/AAAA202012/article/details/123938845)

