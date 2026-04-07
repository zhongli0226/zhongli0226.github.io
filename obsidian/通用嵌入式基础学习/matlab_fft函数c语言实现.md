---
title: matlab_fft函数c语言实现
---

## 前言

最近工作移植PPG算法，将MATLAB上代码移植到嵌入式设备上去。因为心率算法利用FFT实现会较为简单，所以又重新了解了一下大学里学的FFT，并写了C语言实现MATLAB的FFT接口的代码。看了好多都是用的递归写的，这样对于算法复杂度来说还是挺大的，这里参考了这篇大佬的[文章](https://blog.csdn.net/YAOHAIPI/article/details/102307425)，将大佬的代码稍加修改，整体效果还是不错的。

## FFT介绍

### 1.DFT与FFT

> [!NOTE] DFT
> **DFT一般是指离散傅里叶变换**（Discrete Fourier Transform，DFT）是信号分析的最基本方法，傅里叶变换是傅里叶分析的核心，通过它把信号从时间域变换到频率域，进而研究信号的频谱结构和变化规律。
>
> 离散傅里叶变换（DFT），是傅里叶变换在时域和频域上都呈现离散的形式，将时域信号的采样变换为在离散时间傅里叶变换（DTFT）频域的采样。在形式上，变换两端（时域和频域上）的序列是有限长的，而实际上这两组序列都应当被认为是离散周期信号的主值序列。即使对有限长的离散信号作DFT，也应当将其看作经过周期延拓成为周期信号再作变换。**在实际应用中通常采用快速傅里叶变换以高效计算DFT。** ——百度

> [!NOTE] FFT
> **FFT一般指快速傅里叶变换** (fast Fourier transform), 即利用计算机计算离散傅里叶变换（DFT)的高效、快速计算方法的统称，简称FFT。快速傅里叶变换是1965年由J.W.库利和T.W.图基提出的。采用这种算法能使计算机计算离散傅里叶变换所需要的乘法次数大为减少，特别是被变换的抽样点数N越多，FFT算法计算量的节省就越显著。——百度

这里可以这么理解，FFT就是计算机加速DFT计算过程的算法的称呼。

### 2.FFT算法介绍

#### DFT公式

$$
X(k) = DFT[X(n)] = \sum_{n = 0}^{N-1} x(n)W_N^{nk}
$$

#### 旋转因子

计算DFT时，如采用暴力计算，则：
$$
f(x)=a_0+a_1x+a_2x^2+a_3x^3+...+a_nx^n
$$
这里我们可以引入一些特别的x，让他们的若干次平方之后结果为1。

 首先我们可以想到1和-1满足条件，1的多少次方都是1，-1的偶数次方是1，但是又出现了一个新的问题，那就是1和-1只有两个数，而多项式需要的是n个不同的数。

 然后我们想到了复数，1，i，-1，-i，但是这也只有4个数，依然无法满足条件。

 最后傅里叶引入了一个单位圆。

![c语言fft原理](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/c语言fft原理1.png)
然后把园N等分后（N是2的整数次幂）就得到了
$$
W_N^k=cos(-\frac{2\pi k}{N})+isin(\frac{2\pi k}{N})
$$
其中k就是圆的第k等份

由旋转因子的对称性、均匀性、周期性，我们可以整理出旋转因子的两个很重要的性质。
$$
W_N^k=W_{2N} ^{2k}
$$
$$
W_N^{k+\frac{\pi}{2}}=-W_{N} ^{k}
$$

#### 将旋转因子带入计算

> [!TIP] 参考
> 具体推理过程可以参考[大佬的文章](https://blog.csdn.net/YAOHAIPI/article/details/102307425)

得到两个重要公式：
$$
X(W_N^k)=F(W_\frac N 2 ^k)+W_N^k G(W_\frac N 2 ^k)
$$
$$
X(W_N^{k+\frac{\pi}{2}})=F(W_\frac N 2 ^k)-W_N^k G(W_\frac N 2 ^k)
$$

#### 蝶形运算

先以一个4点蝶形运算图为例说明：详细可以参考这篇[文章](https://blog.csdn.net/qq_39300235/article/details/103453909)

![c语言fft原理](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/c语言fft原理2.png)

> [!NOTE] 感悟
> 第一次了解到这个图的时候是在大三学数字信号与系统，当时期末考试每年必有画这个图的题目，当时也不懂这个图只知道如何画，刷了好多道题，题目到会做了，但这个图所带来的意义一点也不明白。最近深入了解了后才明白这个图的意义，也是代码的核心部分。

当k=0时
$$
\begin{aligned}
X(W_4^0)&=F(W_2^0)+W_4^0 G(W_2^0)\\
&=\sum_{n = 0}^{1}x(2n)(W_2^0)^n+W_4^0\sum_{n = 0}^{1}x(2n+1)(W_2^0)^n
\end{aligned}
$$

$$
\begin{aligned}
F(W_2^0) &=F_f(W_1^0)+W_2^0G_f(W_1^0) \\ 
&=\sum_{n = 0}^{0}x(4n)(W_1^0)^n+W_2^0\sum_{n = 0}^{1}x(4n+2)(W_1^0)^n\\
&=x(0)+x(2)W_2^0
\end{aligned}
$$
$$
\begin{aligned}
G(W_2^0) &=F_g(W_1^0)+W_2^0G_g(W_1^0) \\ 
&=\sum_{n = 0}^{0}x(4n+1)(W_1^0)^n+W_2^0\sum_{n = 0}^{1}x(4n+3)(W_1^0)^n\\
&=x(1)+x(3)W_2^0
\end{aligned}
$$

其中 $F_f$ , $G_f$为$F$的递归函数， $F_g$ , $G_g$为$G$的递归函数。

所以可得$X(W^0_ {4})$为:
$$
x(W_4^0)=x(0)+X(2)W_2^0+W_4^0(x(1)+x(3)W_2^0)
$$
![c语言fft原理](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/c语言fft原理3.png)

这里就为FFT递归版本算法。网上有很多递归版本的写法，也比较容易，这里采用一种迭代$for$循环的方式。

注意观察前后位置的变化$x[0]\quad x[2] \quad x[1] \quad x[3]$变成$X[0]\quad X[1] \quad X[2] \quad X[3]$再看一手8点的。

![c语言fft原理](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/c语言fft原理4.png)

注意观察：

![c语言fft原理](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/c语言fft原理5.png)

**它们分割后排序的二进制表示刚好就是没分割前的二进制表示的相反结果**

到此，算法基本讲解完成，接下来展示代码。

## C语言代码

### 1.定义复数结构体

```c
 /* 复数结构体 */
typedef struct 
{
    double real;
	double imag;
}Complex;
```

### 2.定义复数运算

```c
/* 复数加法 */
void Complex_ADD(Complex a, Complex b, Complex *c)
{
	c->real = a.real + b.real; 
	c->imag = a.imag + b.imag;
}
/* 复数减法 */
void Complex_SUB(Complex a, Complex b, Complex *c)
{
	c->real = a.real - b.real;
	c->imag = a.imag - b.imag;
}
/* 复数乘法 */
void Complex_MUL(Complex a, Complex b, Complex *c)
{
	c->real = a.real * b.real - a.imag * b.imag;
	c->imag = a.real * b.imag + a.imag * b.real;
}
/* 复数绝对值 */
double Complex_ABS(Complex *a)
{
	double b;
	b = sqrt((a->real)*(a->real)+(a->imag)*(a->imag));
	return b;
}
```

### 3.FFT主函数

```c
static double PI=4.0*atan(1); //定义π 因为tan(π/4)=1 所以arctan（1）*4=π，增加π的精度

/**
 * @description: FFT算法（非递归）
 * @param {cs_uint32*} signal_in: 需要fft信号输入
 * @param {cs_uint32} signal_len: 输入信号长度
 * @param {Complex*} fft_out: fft完成后输出结果
 * @param {cs_uint32} fft_point:  采样点数
 * @return {*} 
 */
uint32_t FFT(uint32_t* signal_in, uint32_t signal_len, Complex* fft_out, uint32_t fft_point)
{
	Complex *W;//旋转因子Wn
	uint32_t i,j,k,m;
	Complex temp1,temp2,temp3;//用于交换中间量
	double series;//序列级数
	if(signal_len < fft_point)//采样点数与信号数据对比 
	{
		for(i=0;i < signal_len;i++)
		{
			fft_out[i].real = signal_in[i];
			fft_out[i].imag = 0;
		}
		for(i=signal_len;i<fft_point;i++)//补0
		{
			fft_out[i].real = 0;
			fft_out[i].imag = 0;
		}
	}else if(signal_len == fft_point)
	{
		for(i=0;i < signal_len;i++)
		{
			fft_out[i].real = signal_in[i];
			fft_out[i].imag = 0;
		}
	}
	else
	{
		for(i=0;i < fft_point;i++)
		{
			fft_out[i].real = signal_in[i];
			fft_out[i].imag = 0;
		}
	}
	if(fft_point%2 != 0)
	{
		return 1;
	}
	
	W = (Complex *)malloc(sizeof(Complex) * fft_point);
	if (W == NULL)
	{
		return 1;
	}
	
	for (i = 0; i < fft_point; i++)
	{
		W[i].real = cos(2*PI/fft_point*i);	 //欧拉表示的实部
		W[i].imag = -1*sin(2*PI/fft_point*i);//欧拉表示的虚部
	}
	
	for(i = 0;i < fft_point;i++)
	{
		k = i;
		j = 0;
		series = log(fft_point)/log(2); //算出序列的级数
		while((series--) > 0)//利用按位与以及循环实现码位颠倒
		{
			j = j << 1;
			j|=(k & 1);
			k = k >> 1;
		}
		if(j > i) //将x(n)的码位互换
		{
			temp1 = fft_out[i];
			fft_out[i] = fft_out[j];
			fft_out[j] = temp1;
		}
	}
	series = log(fft_point)/log(2); //蝶形运算的级数
	
	for(i = 0; i<series;i++)
	{
		m = 1<<i; //移位 每次都是2的指数的形式增加，其实也可以用m=2^i代替
		for(j = 0;j<fft_point;j+=2*m) //一组蝶形运算，每一组的蝶形因子乘数不同
		{
			for(k=0;k<m;k++)//蝶形结点的距离  一个蝶形运算 每个组内的蝶形运算
			{
				Complex_MUL(fft_out[k+j+m],W[fft_point*k/2/m],&temp1);
				Complex_ADD(fft_out[j+k],temp1,&temp2);
				Complex_SUB(fft_out[j+k],temp1,&temp3);
				fft_out[j+k] = temp2;
				fft_out[j+k+m] = temp3;
			}
		}
	}
	free(W);
	return 0;
}
```
## 2023/3/22
### 算法优化说明

此版本FFT为最基本FFT算法，在嵌入式设备调用过程中，可能会出现资源占用过多，影响整体性能的情况，这里提供一些方法可根据实际需要自行调整和优化。

##### 方法1：更改数据类型

​	目前浮点数据类型都采用`double`类型可以根据实际情况更改为`float`，但会存在精度下降的问题

##### 方法2：查表法

​	若在可以确定FFT采样点数的情况下，可以将相关运算提前运算好，存入常量中，之间代入运算。例如：

```c
series = log(fft_point) / log(2); //算出序列的级数
```

在确认采样点数后可以之间将计算好的值赋值为常量。

```c
	W = (Complex*)malloc(sizeof(Complex) * fft_point);
	if (W == NULL)
	{
		return 1;
	}

	for (i = 0; i < fft_point; i++)
	{
		W[i].real = cos(2 * PI / fft_point * i);	 //欧拉表示的实部
		W[i].imag = -1 * sin(2 * PI / fft_point * i);//欧拉表示的虚部
		//printf("{%lf,%lf},\n",W[i].real,W[i].imag);
	}
```

确认好采样点数后，将欧拉角直接设定为常量数组，减少了堆的开销，也减少了运算时间。

##### 方法3：初始化法

​	若无法确认采样点数，可以采样初始化法，将**方法2**中的运算创建一个初始化函数如：`FFT_Init`在初始过程中完成运算，可以减少实际调用接口时减少运算量。但对比与**方法2**会增加内存大小。

##### 方法4：调用arm-dsp库中fft运算

​	运算速度极快，速度是此算法10倍以上。精度约为0.00001，占用rom更大。部分接口采用汇编编写需要转化。