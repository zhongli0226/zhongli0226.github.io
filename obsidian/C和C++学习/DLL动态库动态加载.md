---
title: DLL动态库动态加载
---

# 库的调用方式

在VS下调用库有两种形式：
- 静态加载
- 动态加载

静态加载下，对应的头文件、DLL和LIB缺一不可，并且产生的EXE没有找到DLL文件的话就会导致"应用程序初始化失败"。
动态加载下，只需要DLL，通过LoadLibrary()函数进行加载，但该方式对生成的dll的规范有一定的要求否则容易出错。
下面主要介绍如何正常动态加载调用DLL。

# 动态加载

1. LoadLibrary是用来加载dll的，格式为

```c++
HINSTANCE hdll;
hdll=LoadLibrary("Image Enhance.dll");
```

调用成功后返回函数地址，否则返回0或NULL

> [!NOTE] 错误原因和解决方法
> 1.路径不对（程序与dll要放在同一文件夹）
> 2.dll本身错误（依赖其他dll）借助depends.exe查看DLL依赖那些DLL

2. GetProcAddress()是用来获取函数地址的，格式为：

```c++
fun1 =(DLLfun)GetProcAddress(hdll, "sharpen");
```

调用成功后返回函数地址，否则返回0或NULL

> [!NOTE] 错误原因和解决方法
> 当返回为0时，可以使用depends.exe工具来查看DLL里函数接口的具体的名字，可以发现会出现这种"?? 0sharpen @@QAE@XZ"奇怪的命名方式，软件上可以试着吧这个段替换原函数名测试一下，发现运行应该就正常了。
> 但是这种方式调用起来很不方式，其实这是创建的DLL库时，写的代码不够规范。
> 头文件中定义__declspec(dllexport) 时，要加上extern "C",从而规范dll的输出符合C标准，否则容易生成带@之类的字符串。extern"C"使得在C++中使用C编译方式成为可能。在"C++"下定义"C"函数，需要加extern"C"关键词。用extern "C"来指明该函数使用C编译方式。加上extern "C"后，输出函数的形式为"sharpen"，符合预期标准。
> 其他标准可以参考：[dll 导出函数名的那些事_vs dll函数名不一致-CSDN博客](https://blog.csdn.net/qq_16209077/article/details/51989114)

```c++
#define IMG_EXPORTS extern "C" __declspec(dllexport)
//或者 extern "C" _declspec(dllimport) int calculateLineNum(CString filePath);
```

3. FreeLibrary()是用来释放加载dll时占用的空间的，由于Loadlibrary()为对dll的显式加载（又叫动态加载），这种方式不会在用完dll后自动清理dll所占用的空间，所以我们要手动清除dll所占用的空间。否则会导致内存泄漏。调用格式如下：

```c++
FreeLibrary(hdll);
```

参考链接：[VS下动态库dll的显式调用(动态调用)_vs项目dll显式加载-CSDN博客](https://blog.csdn.net/liangyanghui/article/details/77981848)
