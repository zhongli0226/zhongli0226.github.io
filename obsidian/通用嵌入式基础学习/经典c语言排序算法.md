# 前言

前段时间偶然在公众号中看到了一篇汇总c语言排序算法的文章，感觉蛮不错的，这里直接copy记录下，学习积累一下。

[演示C语言经典排序算法 (qq.com)](https://mp.weixin.qq.com/s/gMpUouNHP9rscsXZuPm1Uw)

# 排序算法简介

## 1.算法分类

十种常见排序算法可以分为两大类：

* 比较类排序：通过比较来决定元素间的相对次序，由于其时间复杂度不能突破O(nlogn)，因此也称为非线性时间比较类排序。
* 非比较类排序：不通过比较来决定元素间的相对次序，它可以突破基于比较排序的时间下界，以线性时间运行，因此也称为线性时间非比较类排序。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法1.png)

## 2.算法复杂度

| 排序算法 | 平均时间复杂度 | 最差时间复杂度 | 空间复杂度 |    数据对象稳定性    |
| :------: | :------------: | :------------: | :--------: | :------------------: |
| 冒泡排序 |     O(n2)      |     O(n2)      |    O(1)    |         稳定         |
| 选择排序 |     O(n2)      |     O(n2)      |    O(1)    | 数组不稳定，链表稳定 |
| 插入排序 |     O(n2)      |     O(n2)      |    O(1)    |         稳定         |
| 快速排序 |   O(n*log2n)   |     O(n2)      |  O(log2n)  |        不稳定        |
|  堆排序  |   O(n*log2n)   |   O(n*log2n)   |    O(1)    |        不稳定        |
| 归并排序 |   O(n*log2n)   |   O(n*log2n)   |    O(n)    |         稳定         |
| 希尔排序 |   O(n*log2n)   |     O(n2)      |    O(1)    |        不稳定        |
| 计数排序 |     O(n+m)     |     O(n+m)     |   O(n+m)   |         稳定         |
|  桶排序  |      O()       |      O(n)      |    O(n)    |         稳定         |
| 基数排序 |      O()       |     O(n2)      |            |         稳定         |

# 算法详细说明

## 1.冒泡排序

算法思路：

* 比较相邻的元素。如果第一个比第二个大，就交换它们两个
* 对每一对相邻元素作同样的工作，从开始第一对到结尾的最后一对，这样在最后的元素应该会是最大的数；
* 针对所有的元素重复以上的步骤，除了最后一个；
* 重复步骤1~3，直到排序完成。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法2.gif)

Code：

```c
void bubbleSort(sort_type *a, uint32_t n)
{
    for (uint32_t i = 0; i < n - 1; ++i)
    {
        for (uint32_t j = 0; j < n - i - 1; ++j)
        {
            if (a[j] > a[j + 1])
            {
                sort_type tmp = a[j];  //交换
                a[j] = a[j + 1];
                a[j + 1] = tmp;
            }
        }
    }
}

```

eg:

```c
bubbleSort(arr, sizeof(arr) / sizeof(sort_type));
```

## 2.选择排序

算法思路：

* 在未排序序列中找到最小（大）元素，存放到排序序列的起始位置
* 从剩余未排序元素中继续寻找最小（大）元素，然后放到已排序序列的末
* 以此类推，直到所有元素均排序完毕

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法3.gif)

Code：

```c
void selectionSort(sort_type *arr, uint32_t n) {
    uint32_t minIndex;
    sort_type temp;
    for (uint32_t i = 0; i < n - 1; i++) {
        minIndex = i;
        for (uint32_t j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {     // 寻找最小的数
                minIndex = j;                 // 将最小数的索引保存
            }
        }
        temp = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = temp;
    }
}
```

eg:

```c
selectionSort(arr, sizeof(arr) / sizeof(sort_type));
```

## 3.插入排序

算法思路：

* 从第一个元素开始，该元素可以认为已经被排序；

* 取出下一个元素，在已经排序的元素序列中从后向前扫描；

* 如果该元素（已排序）大于新元素，将该元素移到下一位置；

* 重复步骤3，直到找到已排序的元素小于或者等于新元素的位置；

* 将新元素插入到该位置后；
* 重复步骤2~5。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法4.gif)

Code：

```c
void InsertSort(sort_type *a, uint32_t n)
{
    for (uint32_t i = 1; i < n; i++) {
        if (a[i] < a[i - 1]) {   //若第i个元素大于i-1元素，直接插入。小于的话，移动有序表后插入
            int32_t j = i - 1;
            sort_type x = a[i];     //复制为哨兵，即存储待排序元素
            a[i] = a[i - 1];           //先后移一个元素
            while (x < a[j]) {   //查找在有序表的插入位置
                a[j + 1] = a[j];   
                j--;            //元素后移
                if (j < 0)     //注意加入指针限制
                    break;         
            }
            a[j + 1] = x;     //插入到正确位置
        }
    }
}
```

> 分析：插入排序在实现上，通常采用in-place排序（即只需用到O(1)的额外空间的排序），因而在从后向前扫描过程中，需要反复把已排序元素逐步向后挪位，为最新元素提供插入空间。

eg:

```c
InsertSort(arr, sizeof(arr) / sizeof(sort_type));
```

## 4.快速排序

快速排序的基本思想是通过一趟排序将待排记录分隔成独立的两部分，其中一部分记录的关键字均比另一部分的关键字小，则可分别对这两部分记录继续进行排序，以达到整个序列有序。

算法思路：

* 选取第一个数为基准
* 将比基准小的数交换到前面，比基准大的数交换到后面
* 递归地（recursive）把小于基准值元素的子数列和大于基准值元素的子数列排序

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法5.gif)

Code：

```c
void QuickSort(sort_type *v, int32_t low, int32_t high) {
    if (low >= high)  // 结束标志
        return;
    int32_t first = low;  // 低位下标
    int32_t last = high;  // 高位下标
    sort_type key = v[first];  // 设第一个为基准


    while (first < last)
    {
        // 将比第一个小的移到前面
        while (first < last && v[last] >= key)
            last--;
        if (first < last)
            v[first++] = v[last];


        // 将比第一个大的移到后面
        while (first < last && v[first] <= key)
            first++;
        if (first < last)
            v[last--] = v[first];
    }
    //
    v[first] = key;
    // 前半递归
    QuickSort(v, low, first - 1);
    // 后半递归
    QuickSort(v, first + 1, high);
```

eg:

```c
QuickSort(arr, 0, (sizeof(arr) / sizeof(sort_type)) - 1);
```

## 5.堆排序

堆排序（Heapsort）是指利用堆这种数据结构所设计的一种排序算法。堆积是一个近似完全二叉树的结构，并同时满足堆积的性质：即子节点的键值或索引总是小于（或者大于）它的父节点。

算法思路：

* 将初始待排序关键字序列(R1,R2….Rn)构建成大顶堆，此堆为初始的无序区；
* 将堆顶元素R[1]与最后一个元素R[n]交换，此时得到新的无序区(R1,R2,……Rn-1)和新的有序区(Rn),且满足R[1,2…n-1]<=R[n]；
* 由于交换后新的堆顶R[1]可能违反堆的性质，因此需要对当前无序区(R1,R2,……Rn-1)调整为新堆，然后再次将R[1]与无序区最后一个元素交换，得到新的无序区(R1,R2….Rn-2)和新的有序区(Rn-1,Rn)。不断重复此过程直到有序区的元素个数为n-1，则整个排序过程完成。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法6.gif)

Code：

```c
// 堆排序：（最大堆，有序区）。从堆顶把根卸出来放在有序区之前，再恢复堆。

void swap(sort_type* p1, sort_type* p2)
{
    sort_type t = *p1;
    *p1 = *p2;
    *p2 = t;
}
void max_heapify(sort_type arr[], int32_t start, int32_t end) {
    //建立父节点指标和子节点指标
    int32_t dad = start;
    int32_t son = dad * 2 + 1;
    while (son <= end) { //若子节点在范围内才做比较
        if (son + 1 <= end && arr[son] < arr[son + 1]) //先比较两个子节点指标，选择最大的
            son++;
        if (arr[dad] > arr[son]) //如果父节点大于子节点代表调整完成，直接跳出函数
            return;
        else { //否则交换父子內容再继续子节点与孙节点比較
            swap(&arr[dad], &arr[son]);
            dad = son;
            son = dad * 2 + 1;
        }
    }
}

void heap_sort(sort_type arr[], int32_t len) {
    //初始化，i从最后一个父节点开始调整
    for (int32_t i = len / 2 - 1; i >= 0; i--)
        max_heapify(arr, i, len - 1);
    //先将第一个元素和已经排好的元素前一位做交换，再从新调整(刚调整的元素之前的元素)，直到排序完成
    for (int32_t i = len - 1; i > 0; i--) {
        swap(&arr[0], &arr[i]);
        max_heapify(arr, 0, i - 1);
    }
}
```

eg:

```c
heap_sort(arr, sizeof(arr) / sizeof(sort_type));
```

## 6.归并排序

归并排序是建立在归并操作上的一种有效的排序算法。该算法是采用分治法（Divide and Conquer）的一个非常典型的应用。将已有序的子序列合并，得到完全有序的序列；即先使每个子序列有序，再使子序列段间有序。若将两个有序表合并成一个有序表，称为2-路归并。 

算法思路：

* 把长度为n的输入序列分成两个长度为n/2的子序列；

* 对这两个子序列分别采用归并排序；
* 将两个排序好的子序列合并成一个最终的排序序列。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法7.gif)

Code：

```c
//将r[i…m]和r[m +1 …n]归并到辅助数组rf[i…n]
void Merge(sort_type* r, sort_type* rf, int32_t i, int32_t m, int32_t n)
{
    int32_t j, k;
    for (j = m + 1, k = i; i <= m && j <= n; ++k) {
        if (r[j] < r[i]) rf[k] = r[j++];
        else rf[k] = r[i++];
    }
    while (i <= m)  rf[k++] = r[i++];
    while (j <= n)  rf[k++] = r[j++];
}


void MergeSort(sort_type* r, sort_type* rf, int32_t lenght)
{
    int32_t len = 1;
    sort_type* q = r;
    sort_type* tmp;
    while (len < lenght) {
        int32_t s = len;
        len = 2 * s;
        int32_t i = 0;
        while (i + len < lenght) {
            Merge(q, rf, i, i + s - 1, i + len - 1); //对等长的两个子表合并
            i = i + len;
        }
        if (i + s < lenght) {
            Merge(q, rf, i, i + s - 1, lenght - 1); //对不等长的两个子表合并
        }
        tmp = q; q = rf; rf = tmp; //交换q,rf，以保证下一趟归并时，仍从q 归并到rf
    }
}
```

eg：

```c
MergeSort(arr, b, sizeof(arr) / sizeof(sort_type));
```

## 7.希尔排序

1959年Shell发明，第一个突破O(n2)的排序算法，是简单插入排序的改进版。它与插入排序的不同之处在于，它会优先比较距离较远的元素。希尔排序又叫缩小增量排序。

算法思路：

* 选择一个增量序列t1，t2，…，tk，其中ti>tj，tk=1；
* 按增量序列个数k，对序列进行k 趟排序；
* 每趟排序，根据对应的增量ti，将待排序列分割成若干长度为m 的子序列，分别对各子表进行直接插入排序。仅增量因子为1 时，整个序列作为一个表来处理，表长度即为整个序列的长度。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法8.gif)

Code：

```c
void swap(sort_type* p1, sort_type* p2)
{
    sort_type t = *p1;
    *p1 = *p2;
    *p2 = t;
}

void shell_sort(sort_type *array, int32_t length) {
    int32_t h = 1;
    while (h < length / 3) {
        h = 3 * h + 1;
    }
    while (h >= 1) {
        for (int i = h; i < length; i++) {
            for (int j = i; j >= h && array[j] < array[j - h]; j -= h) {
                swap(&array[j], &array[j - h]);
            }
        }
        h = h / 3;
    }
}
```

eg:

```c
shell_sort(arr, sizeof(arr) / sizeof(sort_type));
```

## 8.计数排序

计数排序不是基于比较的排序算法，其核心在于将输入的数据值转化为键存储在额外开辟的数组空间中。作为一种线性时间复杂度的排序，计数排序要求输入的数据必须是有确定范围的整数。

算法思路：

* 找出待排序的数组中最大和最小的元素；
* 统计数组中每个值为i的元素出现的次数，存入数组C的第i项；
* 对所有的计数累加（从C中的第一个元素开始，每一项和前一项相加）；
* 反向填充目标数组：将每个元素i放在新数组的第C(i)项，每放一个元素就将C(i)减去1。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法9.gif)

Code：

```c
void CountSort(sort_type* a, int32_t len)
{
    //通过max和min计算出临时数组所需要开辟的空间大小
    sort_type max = a[0], min = a[0];
    for (int32_t i = 0; i < len; i++) {
        if (a[i] > max)
            max = a[i];
        if (a[i] < min)
            min = a[i];
    }
    //使用calloc将数组都初始化为0
    int32_t range = max - min + 1;
    int32_t* b = (int32_t*)calloc(range, sizeof(int32_t));
    //使用临时数组记录原始数组中每个数的个数
    for (int32_t i = 0; i < len; i++) {
        //注意：这里在存储上要在原始数组数值上减去min才不会出现越界问题
        b[a[i] - min] += 1;
    }
    int32_t j = 0;
    //根据统计结果，重新对元素进行回收
    for (int32_t i = 0; i < range; i++) {
        while (b[i]--) {
            //注意：要将i的值加上min才能还原到原始数据
            a[j++] = i + min;
        }
    }
    //释放临时数组
    free(b);
    b = NULL;
}
```

eg:

```c
CountSort(arr, sizeof(arr) / sizeof(sort_type));
```

## 9.桶排序

将值为i的元素放入i号桶，最后依次把桶里的元素倒出来。

算法思想：

* 设置一个定量的数组当作空桶子。

* 寻访序列，并且把项目一个一个放到对应的桶子去。

* 对每个不是空的桶子进行排序。
* 从不是空的桶子里把项目再放回原来的序列中。

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法10.gif)

Code：

```c
void Bucket_Sort(sort_type *a, int32_t n) {
    int32_t i, j = 0;
    sort_type max = a[0];
    for (i = 1; i < n; i++)
    {
        if (max < a[i])
        {
            max = a[i];
        }
    }
    int32_t* buckets = (int32_t*)malloc((max + 1) * sizeof(int32_t));
    // 将buckets中的所有数据都初始化为0
    memset(buckets, 0, (max + 1) * sizeof(int32_t));
    // 1.计数
    for (i = 0; i < n; i++) {
        buckets[a[i]]++;
    }
    // 2.排序
    for (i = 0; i < max + 1; i++) {
        while ((buckets[i]--) > 0) {
            a[j++] = i;
        }
    }
    //释放临时数组
    free(buckets);
    buckets = NULL;
}
```

eg:

```c
Bucket_Sort(arr, sizeof(arr) / sizeof(sort_type));
```

## 10.基数排序

一种多关键字的排序算法，可用桶排序实现。

算法思想：

* 取得数组中的最大数，并取得位数；
* arr为原始数组，从最低位开始取每个位组成radix数组；
* 对radix进行计数排序（利用计数排序适用于小范围数的特点）

![排序算法](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/排序算法11.gif)

Code：

```c
int32_t maxbit(sort_type*data, int32_t n) //辅助函数，求数据的最大位数
{
    sort_type maxData = data[0];  ///< 最大数
    /// 先求出最大数，再求其位数，这样有原先依次每个数判断其位数，稍微优化点。
    for (int i = 1; i < n; ++i)
    {
        if (maxData < data[i])
            maxData = data[i];
    }
    int32_t d = 1;
    int32_t p = 10;
    while (maxData >= p)
    {
        //p *= 10; // Maybe overflow
        maxData /= 10;
        ++d;
    }
    return d;
}
void radixsort(sort_type *data, int32_t n) //基数排序
{
    int32_t d = maxbit(data, n);
    int32_t* tmp = (int32_t*)malloc(n * sizeof(int32_t));
    int32_t* count = (int32_t*)malloc(10 * sizeof(int32_t)); //计数器
    int32_t i, j, k;
    int32_t radix = 1;
    for (i = 1; i <= d; i++) //进行d次排序
    {
        for (j = 0; j < 10; j++)
            count[j] = 0; //每次分配前清空计数器
        for (j = 0; j < n; j++)
        {
            k = (data[j] / radix) % 10; //统计每个桶中的记录数
            count[k]++;
        }
        for (j = 1; j < 10; j++)
            count[j] = count[j - 1] + count[j]; //将tmp中的位置依次分配给每个桶
        for (j = n - 1; j >= 0; j--) //将所有桶中记录依次收集到tmp中
        {
            k = (data[j] / radix) % 10;
            tmp[count[k] - 1] = data[j];
            count[k]--;
        }
        for (j = 0; j < n; j++) //将临时数组的内容复制到data中
            data[j] = tmp[j];
        radix = radix * 10;
    }
    //释放临时数组
    free(tmp);
    tmp = NULL;
    free(count);
    count = NULL;
}
```

eg:

```c
radixsort(arr, sizeof(arr) / sizeof(sort_type));
```

## 注意

**以上排序算法仅在整数数据类型下测试验证过，在浮点数情况下需要根据实际情况调整。**

# 参考文章

* [演示C语言经典排序算法 (qq.com)](https://mp.weixin.qq.com/s/gMpUouNHP9rscsXZuPm1Uw)
* [数据结构与算法——堆和堆排序 动画演示_堆排序动画_l0919160205的博客-CSDN博客](https://blog.csdn.net/l0919160205/article/details/90584394)

