---
title: c语言快速数学运算
---

# 前言

最近一直在做算法移植的工作，对于代码的运行时间，和代码优化有了进一步的理解，这里不得的佩服任天堂的代码优化能力，能将那么复杂的游戏放入ns那么垃圾的机器中运行。

代码的优化本质其实就是数学方法与代码的结合，强大的代码优化的程序员数学能力也一定是顶尖的。

这里列举一些c语言中快速数学运算的方法，尤其是第一种运算方式，还有个非常有趣的故事，有兴趣可以自行去了解。

# 快速平方根求导

> [!NOTE] 背景
> 代码出自90年代经典游戏Quake-III Arena (雷神之锤3)，QUAKE的开发商ID SOFTWARE 遵守GPL协议，公开了QUAKE-III的原代码，在/code/game/q_math.c里发现了这样一段代码。
>
> 它的作用是将一个数开平方并取倒。这段代码比(float)(1.0/sqrt(x))快4倍

```c
float Q_rsqrt( float number )
{
	long i;
	float x2, y;
	const float threehalfs = 1.5F;
 
	x2 = number * 0.5F;
	y  = number;
	i  = * ( long * ) &y;						// evil floating point bit level hacking
	i  = 0x5f3759df - ( i >> 1 );               // what the fuck?
	y  = * ( float * ) &i;
	y  = y * ( threehalfs - ( x2 * y * y ) );   // 1st iteration
//	y  = y * ( threehalfs - ( x2 * y * y ) );   // 2nd iteration, this can be removed
 
#ifndef Q3_VM
#ifdef __linux__
	assert( !isnan(y) ); // bk010122 - FPE?
#endif
#endif
	return y;
}
```

测试结果

```c
Q_rsqrt(1254.78f); // 0.0282281
1/sqrt(1254.78f);  // 0.0282303
```

# 快速平方根

根据上面这个举一反三：

```c
float Q_sqrt( float number )
{
	int i;
	float x2, y;
	const float threehalfs = 1.5F;

	x2 = number * 0.5F;
	y  = number;
	i  = * ( int * ) &y;     
	i  = 0x5f375a86 - ( i >> 1 ); 
	y  = * ( float * ) &i;
	y  = y * ( threehalfs - ( x2 * y * y ) ); 
	y  = y * ( threehalfs - ( x2 * y * y ) );  	
	y  = y * ( threehalfs - ( x2 * y * y ) ); 
	return number*y;
}
```

测试结果

```c
Q_sqrt(54.785613f); // 7.40173
1/sqrt(54.785613);  // 7.40173
```

# e^x快速运算

```c
double FastExp(double y)
{
    double result;
    *((int*)(&result) + 0) = 0;
    *((int*)(&result) + 1) = 1512775 * y + 1072632447;
    return result;
}
```

测试结果：

```c
FastExp(2);//  7.30962
exp(2);    //  7.38906
```

# 2^x快速运算

```c
#define _BIT(n) (1<<(n))
float fast_exp2(float x)
{
    union { uint32_t i; float f; } v;
    float offset = (x < 0) ? 1.0f : 0.0f;
    float clipp = (x < -126) ? -126.0f : x;
    int w = clipp;
    float z = clipp - w + offset;
    v.i = (uint32_t)(_BIT(23) * (clipp + 121.2740575f + 27.7280233f / (4.84252568f - z) - 1.49012907f * z));
    return v.f;
}
```

测试

```c
fast_exp2(10);  //1023.99
exp2(10);       // 1024
```

# 快速平方根

```c
uint32_t usqrt_simple(uint32_t d, uint32_t N)
{
    uint32_t t, q = 0, r = d;
    do
    {
        N--;
        t = 2 * q + (1 << N);
        if ((r >> N) >= t)
        {
            r -= (t << N);
            q += (1 << N);
        }
    } while (N);
    return  q;
}
```

> [!NOTE] 提示
> 不够实用，只适用于定点数，d为需要平方根的数据，N为结果最小二进制的位数，

测试

```c
usqrt_simple(5263418,15); // 2294
sqrt(5263418);            // 2294.21
```

# 快速ln(x)计算

```c
double FastLog(double x)
{
    double m;
    int k = 1, op = 2;
    double tmp = x / op;
    if (x <= 1) return 0;
    while (tmp >= 2)
    {
        op <<= 1;
        tmp = x / op;
        k++;
    }
    k--;
    m = tmp - 1;
    if (m <= 0.25) return 1.3125 * m + k;
    else if (m <= 0.5) return 1.078125 * m + 0.00015625 + k;
    else if (m <= 0.75) return 1.015625 * m + 0.0625 + k;
    else if (m <= 1) return 0.75 * m + 0.25 + k;
    else return 0;
}
```

测试

```c
FastLog(9.6); //2.2625
log(9.6);     //2.26176
```

# 快速log2(x)计算

```c
float fast_log2(float x)
{
    union { float f; uint32_t i; } vx;
    union { uint32_t i; float f; } mx;
    vx.f = x;
    mx.i = (vx.i & 0x007FFFFF) | 0x3F000000;
    float y = vx.i;
    y *= 1.1920928955078125e-7f;
    return y - 124.22551499f - 1.498030302f * mx.f - 1.72587999f / (0.3520887068f + mx.f);
}
```

测试

```c
fast_log2(10);  // 3.32186
log2(10);       // 3.32193
```

## 2023年9月14日更新

```c
/*
 * @brief   计算二进制表示中1出现的个数的快速算法.
 *          有c个1，则循环c次
 * @inputs  
 * @outputs 
 * @retval  
 */
int ones_32(uint32_t n)
{
    unsigned int c =0 ;
    for (c = 0; n; ++c)
    {
        n &= (n -1) ; // 清除最低位的1
    }
    return c ;
}

/*
 * @brief   
 *   floor{long2(x)}
 *   x must > 0
 * @inputs  
 * @outputs 
 * @retval  
 */
uint32_t floor_log2_32(uint32_t x)
{
    x |= (x>>1);
    x |= (x>>2);
    x |= (x>>4);
    x |= (x>>8);
    x |= (x>>16);

    return (ones_32(x>>1));
}
```

此新方式得出结果为log2()取整。

# 快速平方运算

```c
float fast_powf(float base, float exponent)
{
    return fast_exp2(fast_log2(base)*exponent);
}
```

测试

```c
fast_powf(3.2,5);  //335.484
powf(3.2,5);       //335.544
```

# 快速sin/cos运算

```c
#define M_TAU (2*M_PI)
float fast_cosc(float x)
{
    x -= 0.25f + floorf(x + 0.25f);
    x *= 16.0f * (fabs(x) - 0.5f);
    x += 0.225f * x * (fabs(x) - 1.0f);
    return x;
}

float fast_sinf(float x)
{
    return fast_cosc(x/M_TAU - 0.25f);
}

float fast_cosf(float x)
{
    return fast_cosc(x/M_TAU);
}
```

测试

```c
fast_sinf(10);    // -0.544218
sinf(10);		  // -0.544021
fast_cosf(10);	  // -0.839773
cosf(10);		  // -0.839072
```

# 参考文章

[C语言高速数学库 (aicdg.com)](http://aicdg.com/fast-math/)

[0x5f3759df的数学原理_ACdreamers的博客-CSDN博客](https://blog.csdn.net/ACdreamers/article/details/12349561?spm=1001.2101.3001.6650.11&utm_medium=distribute.pc_relevant.none-task-blog-2~default~CTRLIST~Rate-11-12349561-blog-4780189.pc_relevant_3mothn_strategy_and_data_recovery&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2~default~CTRLIST~Rate-11-12349561-blog-4780189.pc_relevant_3mothn_strategy_and_data_recovery&utm_relevant_index=12)