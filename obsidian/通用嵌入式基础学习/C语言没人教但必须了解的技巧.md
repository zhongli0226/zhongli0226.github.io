---
title: C语言没人教但必须了解的技巧
---

# 前言

工作了一年，对于代码的理解更进了一步，标准且好用的c代码能够使开发效率更上一层楼，这里整理了一下最近看到的一些c代码技巧，能使c代码编写更加标准化。

参考文章地址：

* [C语言中常用的宏定义 (qq.com)](https://mp.weixin.qq.com/s/JkJB5a2F3tEZv-sugUTfeg)
* [C语言位操作符8个常用的小技巧 (qq.com)](https://mp.weixin.qq.com/s/3ezGRQ_NnW4_bfnRh6LupA)

# 宏定义类

## 1.防止重复定义

防止头文件重复定义：

```c
#ifndef COMDEF_H
#define COMDEF_H
// 头文件内容
#endif
```

防止宏重复定义：

```c
#ifndef VALUE
	#define VALUE  100
#endif
```

## 2.重新定义类型

```c
typedef unsigned char 		boolean; 	/* Boolean value type. */

typedef unsigned long int 	uint32; 	/* Unsigned 32 bit value */
typedef unsigned short 		uint16; 	/* Unsigned 16 bit value */
typedef unsigned char 		uint8; 		/* Unsigned 8 bit value */

typedef signed long int 	int32; 		/* Signed 32 bit value */
typedef signed short 		int16; 		/* Signed 16 bit value */
typedef signed char 		int8; 		/* Signed 8 bit value */
```

## 3.求两个数最大和最小值

```c
#define MAX( x, y ) ( ((x) > (y)) ? (x) : (y) )
#define MIN( x, y ) ( ((x) < (y)) ? (x) : (y) )
```

> [!NOTE] 注意
> 这里的一些特殊情况详细可参考文章
> [[嵌入式小技巧#② 比较两个数大小宏定义]]
> [嵌入式小技巧 - 一月一星辰 - 博客园 (cnblogs.com)](https://www.cnblogs.com/tangwc/p/17599297.html)

## 4.防止数据溢出

```c
#define INC_SAT( val ) (val = ((val)+1 > (val)) ? (val)+1 : (val))
```

## 5.返回数组元素个数

```c
#define ARR_SIZE( a ) ( sizeof( (a) ) / sizeof( (a[0]) ) )
```

# 位操作技巧

注意：

* 进行位运算时数据全部是换算为二进制的；
* 位操作符只适用于整形变量，不适合浮点数变量（本质是由于两者的数据存储类型不同）。

## 1.交换两个变量的值

```c
int a = 1;
int b = 2;
a ^= b;
b ^= a;
a ^= b;
printf("a: %d b: %d\n", a, b);
```

## 2.求二进制中1的个数

```c
int a = 5;
int count = 0;

while (a) {
  a = a&(a - 1); //每次把最低位丢弃，直到a为0.
  count++;
}
printf("%d\n", count);
```

## 3.求二进制中0的个数

```c
int a = 5;
int count = 0;
while (a+1) {
  a = a | (a + 1);
  count++;
}
printf("%d\n", count);
```

## 4.求一个数的绝对值

```c
int i = -2;
int j = i >> 31;

i = (i ^ j) - j;
printf("%d\n", i);
```

## 5.求一个数的相反数

```c
int i = -2;

i = ~i + 1;
printf("%d\n", i);
```

## 6.判断一个数的奇偶性

```c
int a = 3;

if((a&1) == 1) {
  printf("奇数\n");
} else {
  printf("偶数\n");
}
```

## 7.求两个数的平均数

```c
int a = 3;
int b = 7;

printf("平均值: %d\n", ((a + b) >> 1));
```

## 8.从无符号类型x的第p位开始，取n位数

```c
unsigned GetBits(unsigned x,int p, int n) {
  return (x>>(p+1-n)) & ~(~0<<n);
}
```

