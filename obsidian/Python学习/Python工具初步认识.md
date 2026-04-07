---
title: Python工具初步认识
---

# 前言

在嵌入式开发的过程中，有时需跑大量的离线本地数据验证，虽然利用c语言也可以实现文件批量读取的操作，但是由于c语言需要自己搭建轮子，不如python拥有丰富的库可以调用，况且python也可以调用c语言的动态库，能用较为简单的代码就可以实现数据认证，在日常开发中还是较为方便的。接下来介绍几种我目前常用的几种python工具。

# Pandas库

pandas 是 Python 的核心数据分析支持库，提供了快速、灵活、明确的数据结构，旨在简单、直观地处理关系型、标记型数据。

## 1.安装

pandas 是第三方库，需要单独安装才能使用。

```powershell
pip install pandas
```

## 2.读取CSV文件

CSV文件是电子表格程序常用的逗号分隔值文件。它包含以逗号分隔的纯文本数据集。用于处理大量数据场景。

应用参考：

```python
import pandas as pd

#读取输入文本
path = './indata/in_data.csv'
data = pd.read_csv(path)

a = data['a']
```

这里`a = data['a']`意思为将csv文件中第一行中为`a`这一列中的元素全部提取出来，此时a变量则为`a`这一列下所有元素的是数组。

> [!NOTE] 注意
> 这里所提取出来的数据类型与python中数据类型有所区别，故在一些场合下需要强制转化一下数据类型。

## 3.写入CSV文件

应用参考：

```python
import pandas as pd

#输出信息文本
path = './outdata/out_data.csv'

data_list = []

for i in range(10):
    data_list.append(i)
    
data_df = pd.DataFrame({
    "data":data_list,
})

data_df.to_csv(path, mode='w+', header=True, index = False)
```

以上代码可以实现写入CSV文件一列以`data`为头0~9的数据。

## 4.其他

Pandas还有很多其他功能，在工作中我注意用于这两种功能，若后续再有使用新功能再补充。

# OS库

os库提供通用的、基本的操作系统交互功能。

## 1.遍历文件

如一个工程目录下有需要CSV文件需要读取或有许多文件夹需要遍历操作，可以使用如下方法。

```python
import os

case_path = "./case"


dirnames = []
filenames = []
for dirpath, dirnames, filenames in os.walk(case_path):
    break
for each_file in filenames:
    # os.path.splitext():分离文件名与扩展名
    if os.path.splitext(each_file)[1] == '.csv':
        print(each_file) 
```

此方法可以获得目录下所有csv文件。

`dirpath`：文件夹本身地址

`dirnames`：一个list，文件夹下所有目录名字

`filenames`：一个list，文件夹下所有文件名字

## 2.其他

os库有许多用途，其他可参考网上资源，这里只列举本人在工作中的使用。

# ctypes库

ctypes模块提供了和C语言兼容的数据类型和函数来加载dll文件，因此在调用时不需对源文件做任何的修改。也正是如此奠定了这种方法的简单性。

## 1.C语言动态库生成

在命令台输入命令：

```powershell
gcc -shared -o xxx.dll xxx.c/xxx.cpp
```
在Linux下则编译为.so库。

也可以使用**Visual Studio**的cl编译

## 2.Python调用动态库

较为详细可以参考文章[《深度剖析CPython解释器》](https://www.cnblogs.com/traditional/p/14398434.html)。这里只做简单说明。

我们向C语言函数传递结构体指针：

```c
struct usr_t {
  int len;
  int data[10];
}usr_t;

int test1 (usr_t *data,int *result)
{
   *result = 0;
   for(int i = 0;i< data->len;i++)
   {
       *result += data[i]; 
   }
   return 0;
}
```

Python 调用

```python
from ctypes import *

lib = CDLL("./main.dll")

# 声明用户信息的类，继承自ctypes.Structure
class usr_t(Structure):
    _fields_ = [
        ('len',c_int),
        ('data',c_int*10)]
# 定义传入函数的参数类型   
lib.test1.argtypes = [POINTER(usr_t),POINTER(result)]
# 实例化变量
usr_struct = usr_t()
py_result = result()
PARAM = c_uint * 10
data = PARAM()

usr_struct.len = 10
for i in range(10):
    data[i] = int(i)
usr_struct.data = data

c_result = lib.test1(byref(usr_struct),byref(py_result))
print(py_result)
```

# 后记

Python真的是一个十分强大的语言，编写代码容易，非常丰富的库调用。半年前作为只会c的我，一点也不了解Python，但在这工作的半年里学习了很多Python的用法去解决一些文档数据处理等，特别提高工作效率。而且不一定要一下子完成掌握所有的Python库的内容，而是在工作中需要什么学什么，一步一步积累，回头看就会发现自己掌握的已是参天大树。

# 2023年7月21日

增加两种OS库常用的功能：

### 1.创建文件夹

```python
# 创建文件夹
def mkdir(path):

    folder = os.path.exists(path)

    if not folder:                   #判断是否存在文件夹如果不存在则创建为文件夹
        os.makedirs(path)            #makedirs 创建文件时如果路径不存在会创建这个路径
        print("new folder :" + path)
    else:
        print(path)

```

### 2.调用命令行语句

```python
command = "gcc -shared -o {} {}".format(c_model_dll, c_model_file)

# 编译生成的c代码
os.system(command)
```

