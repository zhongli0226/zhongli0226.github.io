---
title: Keil辅助工具推荐及使用
---

# 前言

再最近的学习当中无意间学到了一些关于Keil自动化运行脚本的方式，特此收集整理记录一下这里主要介绍三种收集而来的工具：

1. Keil编译自动生成定制的Hex文件
2. Keil自动化编译代码脚本
3. Keil编译信息增强工具

# Keil编译自动生成定制的Hex文件
参考链接：[Keil编译自动生成定制的HEX文件_keil定制hex文件名-CSDN博客](https://blog.csdn.net/qq_26043945/article/details/138669433)
## 工具优点

在日常使用Keil编译生成固件的过程中，总是有时管理不当，导致一个版本的固件无法准确定位，又或者每次需要在一顿生成的文件中找到Hex文件并将其按照规范重新命名并发布。而这一串工作可以利用脚本，在工程编译完成后自动执行并将生成的Hex都归入其中。

综上所述脚本需要拥有以下优点：

1. 版本号自动提取，自动提取代码中版本宏定义，处理过程完全自动化。
2. 可自行脚本适配不同项目结构。
3. 获取当前编译时间增加编译时间信息
4. exe运行不依赖任何环境

## 脚本参考代码

```python
import os  
import shutil  
import re  
import glob
from datetime import datetime  
  
 
 
def get_Date():
      
    # 获取当前本地时间和日期  
    now = datetime.now()  
    # 提取年、月、日、小时、分钟  
    year = now.year  
    month = str(now.month).zfill(2)  # 使用 zfill 方法确保月份是两位数  
    day = str(now.day).zfill(2)      # 使用 zfill 方法确保日期是两位数  
    hour = str(now.hour).zfill(2)      # 使用 zfill 方法确保小时是两位数  
    minute = str(now.minute).zfill(2)      # 使用 zfill 方法确保分钟是两位数 
    # 打印这些变量
    print("编译时间:", now)
    
    return str(year)+str(month)+str(day)+str(hour)+str(minute)
 
  
def project_name_file():  
    # 假设你正在查找当前目录下的.uvprojx文件  
    path = '.'  # 当前目录  
  
    # 使用glob模块查找所有.ioc文件  
    ioc_files = glob.glob(os.path.join(path, '*.uvprojx'))  
  
    # 提取文件名（不包括路径和后缀）  
    file_names = [os.path.splitext(os.path.basename(file_path))[0] for file_path in ioc_files]  
  
    return file_names  # 直接返回列表，而不是字符串  
  
def copy_hex_file_to_current_dir(version, Date):  
    # 获取当前目录的绝对路径  
    current_dir = os.path.abspath(os.getcwd())
    # print(current_dir)
  
    # 获取文件名列表  
    file_names = project_name_file()  
  
    for file_name in file_names:  
        # 构建目标文件的绝对路径（假设它在当前目录的Objects子目录中）  
        target_file_path = os.path.join(current_dir, "Objects" , file_name + ".hex")  
        
        # 检查文件是否存在  
        if os.path.exists(target_file_path):  
            # 检查是否有文件夹hex，如果没有则创建  
            if not os.path.exists(os.path.join(current_dir, "hex")):  
                os.makedirs(os.path.join(current_dir, "hex"))  

            # 构建复制到当前目录的新文件的路径  
            new_file_path = os.path.join(current_dir, "hex", file_name + '_' + version + '_' + Date + ".hex")
  
            # 复制文件  
            shutil.copy2(target_file_path, new_file_path)
            
            print('生成的最新HEX文件目录:',new_file_path)
        else:  
            print(f"File {target_file_path} does not exist.")  
  
# 提取版本号（这部分保持不变）  
def extract_version_from_file():
    
    # 获取当前目录的绝对路径  
    current_dir = os.path.abspath('.')  
      
    # 获取父目录的绝对路径  
    parent_dir = os.path.abspath(os.path.join(current_dir, '..'))  
    
    # 构建目标文件的绝对路径（假设它在当前目录的MDK-ARM子目录中）  
    target_file_path = os.path.join(parent_dir, "os", "version.h")
 
    with open(target_file_path, 'r', encoding='utf-8') as file:  
        content = file.read()  
        match = re.search(r'VER_([0-9]+[.][0-9]+[.][0-9]+[.][0-9]+)', content)  # 注意这里添加了+来匹配多个数字  
        if match:
            print('获取到程序版本号: ',match.group())
            return match.group()  
        else:
            
            return None  
 
 
if __name__ == '__main__':  
    print('#'*10,'调用扩展程序_Start','#'*10)
    
    # 提取版本号（这部分保持不变）  
    version = extract_version_from_file()
    
    if version:
        Date = get_Date()
        copy_hex_file_to_current_dir(version,Date)
    else:  
        print("Version not found in version.c file.")  

    print('#'*10,'调用扩展程序_End','#'*10)
 
 
```

> 代码使用注意事项：
>
> 1. 代码放在与 “ *.uvprojx ” 相同目录进行运行。
> 2. 将Python编译生成为exe文件这样就可以利用命令行进行调用exe自动运行。

## Keil工程上设置

1. 首先代码中含有个版本号的宏定义，例如：`#define SOFTWARE_VERSION    "VER_0.1.0.1"`
2. 打开Options魔法棒，找到User栏，在Afrter Build/Rebuid  处写入`./Output_HEX.exe`即可运行生成

# Keil命令行自动编译

参考链接：[keil-autopiler: 一个基于 keil 的自动化编译代码的脚本 (gitee.com)](https://gitee.com/DinoHaw/keil-autopiler)

## 工具优点

可以不用打开Keil软件，直接使用命令行的方式即可进行Keil的编译，在部分有特别需要的工作环境下比较适用，这里只做介绍，不详细讲解，相关使用方法可以参考原链接说明。

# Keil编译信息增加工具

参考链接：[keil-build-viewer: keil MDK 编译信息增强工具 (gitee.com)](https://gitee.com/DinoHaw/keil-build-viewer)

## 工具优点

1. 增强编译Log的信息输出。
2. 输出详细文件的资源占用情况。
3. 对比之前资源情况反应资源增加（减少）情况。

## 使用情况

# Keil执行多条脚本工具方式

由于Keil中，只能支持在After Build/Rebuild后执行两条语句，如当超过两条后，可以选择使用Win下bat脚本，批量运行多个脚本，并在Keil中设置执行bat脚本。

bat脚本如下：执行如下两条脚本

```bat
@echo off

REM 第二条命令行语句
cmd /c "Output_HEX.exe"

REM 第三条命令行语句
cmd /c "keil-build-viewer.exe"
```

