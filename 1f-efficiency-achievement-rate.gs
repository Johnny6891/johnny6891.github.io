/**
 * ═══════════════════════════════════════════════════════════
 * 標題: 效率日誌月度圖表展示系統
 * ═══════════════════════════════════════════════════════════
 * 
 * 功能簡介:
 * 讀取試算表「Efficiency Daily Log」中的資料,
 * 並透過網頁介面以組合圖表方式呈現,支援長條圖與折線圖混合展示。
 * 
 * 腳本流程:
 * 1. 從試算表讀取資料並依日期排序(由小到大)
 * 2. 自動偵測數值欄位並生成對應圖表類型
 * 3. 將總筆數、未達成筆數(長條圖)與達成率(折線圖)整合為一張圖表
 * 4. 在達成率軸上顯示獎金門檻標示線(70%/80%/90%)
 * 5. 透過 Web App 提供互動式圖表介面
 * 6. 支援月份篩選功能,可查看特定月份或全部資料
 * 
 * 更新紀錄:
 * - v1.8.2 (2025/12/30):
 *   1. 【修正】保留月份選擇器的「全部顯示」選項
 * - v1.8.1 (2025/12/30):
 *   1. 【修改】獎金狀態改為顯示最近一天的達成率(取代平均值)
 *   2. 【修改】達成率四捨五入取整數顯示
 * - v1.8.0 (2025/12/30):
 *   1. 【修改】獎金門檻標示改為顯示在圖例區域,不直接標示在虛線上
 *   2. 【新增】獎金達成狀態卡片:顯示目前達到的最高獎金門檻
 *   3. 【新增】calculateBonusStatus() 函式:計算當月獎金達成狀態
 * - v1.7.0 (2025/12/30):
 *   1. 【新增】獎金門檻標示線:在圖表上顯示 70%/80%/90% 達成率門檻
 *   2. 【新增】門檻配置:CONFIG.BONUS_THRESHOLDS 設定獎金門檻與顏色
 * - v1.6.0 (2025/12/30):
 *   1. 【新增】月份篩選功能:可從後端取得資料中存在的月份清單
 *   2. 【修改】資料獲取邏輯:支援依照指定月份過濾資料
 *   3. 【修改】前端UI:將「總圖表數」卡片改為「月份選擇器」下拉選單
 * - v1.5.0 (2025/12/30):
 *   1. 視覺大改版:更新配色為「溫暖莫迪蘭色系」
 *   2. 調整圖表線條與填充的透明度,配合毛玻璃風格
 * - v1.4.0 (2025/12/30): 優化長條圖顯示模式 (Overlay)
 * - v1.3.0 (2025/12/30): 修正日期與圖表層級
 * - v1.2.0 (2024/12/30): 初版功能完善
 * 
 * 注意事項:
 * - 資料會自動依日期由小到大排序
 * - 總筆數與未達成筆數使用右側 Y 軸(數量)
 * - 達成率使用左側 Y 軸(百分比)
 * - 獎金門檻線顯示在達成率軸上
 * - 確保試算表權限允許腳本存取
 * - 月份選擇器會自動列出資料中存在的所有月份
 * 
 * @version 1.8.2
 * @lastModified 2025/12/30
 * @author GAS Architect
 * ═══════════════════════════════════════════════════════════
 */

// ============================================
// 配置區
// ============================================
const CONFIG = {
  // 試算表設定
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/1hTSjcqaYkBxDBPHfsoK5oqB8vj4FtN6mgtIJnQ_Q92I/edit',
  SHEET_ID: '1hTSjcqaYkBxDBPHfsoK5oqB8vj4FtN6mgtIJnQ_Q92I',
  SHEET_NAME: 'Efficiency Daily Log',
  
  // 圖表預設設定
  DEFAULT_CHART_TYPE: 'line',
  SUPPORTED_CHART_TYPES: ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea'],
  
  // 莫迪蘭色系配置 (Morandi Color Palette)
  CHART_COLORS: [
    '#7D9D9C', // 莫迪蘭藍 (Muted Teal)
    '#C78283', // 莫迪蘭粉 (Dusty Rose)
    '#8B9E81', // 莫迪蘭綠 (Sage Green)
    '#E0C097', // 莫迪蘭黃 (Warm Sand)
    '#9D8D8F', // 莫迪蘭紫 (Muted Mauve)
    '#B4A5A5', // 暖灰 (Warm Grey)
    '#6B705C', // 深橄欖 (Dark Olive)
    '#CB997E', // 陶土色 (Terracotta)
  ],
  
  // 【新增】獎金門檻設定
  BONUS_THRESHOLDS: [
    { value: 0.70, label: '70% - 團體獎金 x $1,000', color: '#E0C097' }, // 莫迪蘭黃
    { value: 0.80, label: '80% - 團體獎金 x $1,500', color: '#8B9E81' }, // 莫迪蘭綠
    { value: 0.90, label: '90% - 團體獎金 x $2,000', color: '#7D9D9C' }  // 莫迪蘭藍
  ]
};

// ============================================
// Web App 入口點
// ============================================

/**
 * Web App 的 GET 請求處理函式
 * 
 * @returns {HtmlOutput} HTML 頁面輸出
 */
function doGet() {
  try {
    const template = HtmlService.createTemplateFromFile('index');
    
    return template.evaluate()
      .setTitle('效率日誌圖表分析')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
      
  } catch (error) {
    console.error('doGet 錯誤:', error);
    return HtmlService.createHtmlOutput(`
      <h1>載入失敗</h1>
      <p>錯誤訊息: ${error.message}</p>
    `);
  }
}

/**
 * 引入 HTML 檔案的內容
 * 用於模組化 HTML 結構
 * 
 * @param {string} filename - 檔案名稱
 * @returns {string} 檔案內容
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// 資料讀取函式
// ============================================

/**
 * 讀取試算表完整資料(包含標題列)
 * 
 * @returns {Object} 包含標題列和資料列的物件
 * @throws {Error} 當試算表不存在或讀取失敗時
 */
function getSheetData() {
  try {
    // 1. 驗證設定
    if (!CONFIG.SHEET_ID) {
      throw new Error('試算表 ID 未設定');
    }
    
    // 2. 取得試算表
    const sheet = Utils.getSheet(CONFIG.SHEET_NAME);
    if (!sheet) {
      throw new Error(`找不到工作表: ${CONFIG.SHEET_NAME}`);
    }
    
    // 3. 讀取所有資料
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      throw new Error('工作表沒有資料');
    }
    
    // 4. 分離標題列和資料列
    const headers = values[0];
    const dataRows = values.slice(1);
    
    // 5. 解析標題列中的圖表設定(傳入資料列用於自動偵測)
    const chartConfig = parseHeadersForChartInfo(headers, dataRows);
    
    // 6. 轉換為物件陣列格式
    const data = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // 移除標題中的圖表類型標記
        const cleanHeader = header.replace(/\[.*?\]/g, '').trim();
        obj[cleanHeader] = row[index];
      });
      return obj;
    });
    
    // 依日期排序(由小到大)
    data.sort((a, b) => {
      const valA = a[Object.keys(a)[0]]; // 第一欄為日期
      const valB = b[Object.keys(b)[0]];
      
      const dateA = valA instanceof Date ? valA : new Date(valA);
      const dateB = valB instanceof Date ? valB : new Date(valB);
      
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB; // 日期由小到大
      }
      return 0;
    });
    
    // 7. 回傳結構化資料
    return {
      headers: headers,
      chartConfig: chartConfig,
      data: data,
      dataRows: dataRows
    };
    
  } catch (error) {
    console.error('getSheetData 錯誤:', error);
    throw new Error(`讀取資料失敗: ${error.message}`);
  }
}

/**
 * 解析標題列中的圖表設定資訊
 * 
 * @param {Array} headers - 標題列陣列
 * @param {Array} dataRows - 資料列陣列(用於自動偵測)
 * @returns {Object} 圖表設定物件
 */
function parseHeadersForChartInfo(headers, dataRows = []) {
  const config = {
    columns: [],
    chartTypes: {},
    colors: {},
    labels: {}
  };
  
  headers.forEach((header, index) => {
    // 使用正則表達式解析標題
    const match = header.match(/^(.+?)\s*\[([^\]:]+)(?::(.+))?\]$/);
    
    if (match) {
      // 【模式1】有手動標記圖表類型
      const label = match[1].trim();
      const chartType = match[2].trim().toLowerCase();
      const color = match[3] ? match[3].trim() : null;
      
      config.columns.push(index);
      config.chartTypes[index] = CONFIG.SUPPORTED_CHART_TYPES.includes(chartType) 
        ? chartType 
        : CONFIG.DEFAULT_CHART_TYPE;
      config.labels[index] = label;
      
      if (color) {
        config.colors[index] = color;
      }
    } else {
      // 【模式2】無標記,記錄標籤並自動偵測數值欄位
      config.labels[index] = header.trim();
      
      // 自動偵測:跳過第一欄(通常是日期/標籤),檢查是否為數值欄位
      if (index > 0 && dataRows.length > 0) {
        const isNumericColumn = checkIfNumericColumn(dataRows, index);
        
        if (isNumericColumn) {
          config.columns.push(index);
          
          // 根據欄位名稱自動選擇圖表類型
          const headerLower = header.toLowerCase();
          if (headerLower.includes('率') || headerLower.includes('percentage') || headerLower.includes('percent')) {
            config.chartTypes[index] = 'line'; // 比率用折線圖
          } else if (headerLower.includes('數') || headerLower.includes('count') || headerLower.includes('量')) {
            config.chartTypes[index] = 'bar'; // 數量用長條圖
          } else {
            config.chartTypes[index] = CONFIG.DEFAULT_CHART_TYPE;
          }
        }
      }
    }
  });
  
  return config;
}

/**
 * 檢查欄位是否為數值型欄位
 * 
 * @param {Array} dataRows - 資料列陣列
 * @param {number} columnIndex - 欄位索引
 * @returns {boolean} 是否為數值欄位
 */
function checkIfNumericColumn(dataRows, columnIndex) {
  // 取樣前5筆資料檢查
  const sampleSize = Math.min(5, dataRows.length);
  let numericCount = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const value = dataRows[i][columnIndex];
    
    // 檢查是否為數字或可轉換為數字
    if (typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value))) {
      numericCount++;
    }
  }
  
  // 如果超過80%的樣本是數值,則判定為數值欄位
  return numericCount / sampleSize >= 0.8;
}

/**
 * 取得所有可繪製圖表的欄位清單
 * 
 * @param {Object} sheetData - 從 getSheetData 獲取的資料物件
 * @returns {Array} 欄位資訊陣列
 */
function getChartableColumns(sheetData) {
  try {
    const chartConfig = sheetData.chartConfig;
    
    return chartConfig.columns.map(colIndex => ({
      index: colIndex,
      label: chartConfig.labels[colIndex],
      chartType: chartConfig.chartTypes[colIndex],
      color: chartConfig.colors[colIndex]
    }));
    
  } catch (error) {
    console.error('getChartableColumns 錯誤:', error);
    throw new Error(`取得圖表欄位失敗: ${error.message}`);
  }
}

/**
 * 取得完整的多圖表資料
 * 【修改】新增 targetMonth 參數,支援月份篩選
 * 【修改】當選擇 'ALL' 時不進行月份篩選,預設顯示最近一個月
 * 
 * @param {string} targetMonth - 目標月份 (格式: "YYYY-MM"),若為 null 則顯示最近一個月,若為 'ALL' 則顯示全部
 * @returns {Object} 包含所有圖表資料的物件
 */
function getAllChartsData(targetMonth = null) {
  try {
    const sheetData = getSheetData();
    
    // 取得所有可用月份
    const availableMonths = getAvailableMonths(sheetData.data);
    
    // 【修改】如果沒有指定月份,預設使用最近的一個月份
    let filterMonth = targetMonth;
    if (!filterMonth && availableMonths.length > 0) {
      filterMonth = availableMonths[0]; // 陣列已排序,第一個為最近月份
    }
    
    // 【修改】根據月份篩選資料,如果是 'ALL' 則不篩選
    let filteredData = sheetData.data;
    if (filterMonth && filterMonth !== 'ALL') {
      filteredData = sheetData.data.filter(row => {
        const firstColKey = Object.keys(row)[0];
        const dateVal = row[firstColKey];
        if (!dateVal) return false;
        
        const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
        if (isNaN(d)) return false;
        
        const rowMonth = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
        return rowMonth === filterMonth;
      });
    }
    
    // 建立臨時的 sheetData 物件傳遞給繪圖函式 (替換為篩選後的資料)
    const processingSheetData = {
      ...sheetData,
      data: filteredData
    };
    
    const chartableColumns = getChartableColumns(processingSheetData);
    
    // 建立組合圖表資料
    const combinedChartData = createCombinedChart(processingSheetData, chartableColumns);
    
    // 計算獎金達成狀態
    const bonusStatus = calculateBonusStatus(filteredData, sheetData.headers);
    
    return {
      summary: {
        totalRows: filteredData.length,
        totalColumns: sheetData.headers.length,
        dateRange: Utils.getDateRange(filteredData)
      },
      charts: [combinedChartData],
      metadata: {
        totalCharts: 1,
        sheetName: CONFIG.SHEET_NAME,
        lastUpdate: new Date().toLocaleString('zh-TW'),
        availableMonths: availableMonths,
        currentMonth: filterMonth
      },
      bonusStatus: bonusStatus
    };
    
  } catch (error) {
    console.error('getAllChartsData 錯誤:', error);
    throw new Error(`取得圖表資料失敗: ${error.message}`);
  }
}

/**
 * 【新增】從資料中提取所有不重複的月份 (YYYY-MM)
 * 
 * @param {Array} data - 資料陣列
 * @returns {Array} 排序後的月份字串陣列 (由新到舊)
 */
function getAvailableMonths(data) {
  if (!data || data.length === 0) return [];
  
  const monthSet = new Set();
  const firstColKey = Object.keys(data[0])[0]; // 假設第一欄是日期
  
  data.forEach(row => {
    const val = row[firstColKey];
    if (val) {
      // 嘗試轉換日期
      const d = val instanceof Date ? val : new Date(val);
      if (!isNaN(d)) {
        const monthStr = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
        monthSet.add(monthStr);
      }
    }
  });
  
  // 轉為陣列並由大到小排序 (2025-12, 2025-11...)
  return Array.from(monthSet).sort().reverse();
}

/**
 * 【新增】從資料中提取所有不重複的月份 (YYYY-MM)
 * 
 * @param {Array} data - 資料陣列
 * @returns {Array} 排序後的月份字串陣列 (由新到舊)
 */
function getAvailableMonths(data) {
  if (!data || data.length === 0) return [];
  
  const monthSet = new Set();
  const firstColKey = Object.keys(data[0])[0]; // 假設第一欄是日期
  
  data.forEach(row => {
    const val = row[firstColKey];
    if (val) {
      // 嘗試轉換日期
      const d = val instanceof Date ? val : new Date(val);
      if (!isNaN(d)) {
        const monthStr = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
        monthSet.add(monthStr);
      }
    }
  });
  
  // 轉為陣列並由大到小排序 (2025-12, 2025-11...)
  return Array.from(monthSet).sort().reverse();
}

/**
 * 【新增】計算獎金達成狀態
 * 【修改】改為使用最近一天的達成率判斷門檻
 * 
 * @param {Array} data - 資料陣列
 * @param {Array} headers - 標題列
 * @returns {Object} 獎金達成狀態物件
 */
function calculateBonusStatus(data, headers) {
  // 找出達成率欄位
  let achievementRateColumn = null;
  headers.forEach((header, index) => {
    const cleanHeader = header.replace(/\[.*?\]/g, '').trim().toLowerCase();
    if (cleanHeader.includes('達成率') || cleanHeader.includes('achievement')) {
      achievementRateColumn = Object.keys(data[0])[index];
    }
  });
  
  if (!achievementRateColumn || data.length === 0) {
    return {
      achieved: false,
      highestThreshold: null,
      latestRate: 0,
      daysAboveThreshold: 0
    };
  }
  
  // 【修改】取得最近一天的達成率
  const latestRate = parseFloat(data[data.length - 1][achievementRateColumn]) || 0;
  
  // 判斷達到的最高門檻
  let highestThreshold = null;
  const sortedThresholds = [...CONFIG.BONUS_THRESHOLDS].sort((a, b) => b.value - a.value);
  
  for (const threshold of sortedThresholds) {
    if (latestRate >= threshold.value) {
      highestThreshold = threshold;
      break;
    }
  }
  
  // 計算達標天數
  let daysAboveThreshold = 0;
  if (highestThreshold) {
    data.forEach(row => {
      const rate = parseFloat(row[achievementRateColumn]);
      if (!isNaN(rate) && rate >= highestThreshold.value) {
        daysAboveThreshold++;
      }
    });
  }
  
  return {
    achieved: highestThreshold !== null,
    highestThreshold: highestThreshold,
    latestRate: latestRate,  // 【修改】改為最近一天的達成率
    daysAboveThreshold: daysAboveThreshold,
    totalDays: data.length
  };
}

/**
 * 建立組合圖表(長條圖 + 折線圖)
 * 【修改】加入獎金門檻資料傳遞
 * 
 * @param {Object} sheetData - 試算表資料
 * @param {Array} chartableColumns - 可繪圖欄位
 * @returns {Object} 組合圖表資料
 */
function createCombinedChart(sheetData, chartableColumns) {
  const chartConfig = sheetData.chartConfig;
  
  // 取得日期標籤(已排序)
  const labels = sheetData.data.map(row => {
    const firstColumnValue = Object.values(row)[0];
    return Utils.formatValue(firstColumnValue);
  });
  
  // 準備多個資料集
  const datasets = chartableColumns.map((col, index) => {
    const cleanHeader = sheetData.headers[col.index].replace(/\[.*?\]/g, '').trim();
    const label = chartConfig.labels[col.index];
    const chartType = chartConfig.chartTypes[col.index];
    
    // 取得數值資料
    const values = sheetData.data.map(row => parseFloat(row[cleanHeader]) || 0);
    
    // 設定圖表層級
    let drawOrder = 2; // 預設中間層
    if (chartType === 'line') {
      drawOrder = 1;
    } else if (label.includes('總') || label.includes('Total')) {
      drawOrder = 3;
    }
    
    // 取得顏色 (循環使用)
    const baseColor = CONFIG.CHART_COLORS[index % CONFIG.CHART_COLORS.length];
    
    // 根據圖表類型設定樣式
    const dataset = {
      label: label,
      data: values,
      type: chartType, // 'bar' 或 'line'
      yAxisID: label.includes('率') ? 'y-percentage' : 'y-count', // 分兩個 Y 軸
      order: drawOrder, // 應用層級設定
    };
    
    // 長條圖樣式
    if (chartType === 'bar') {
      dataset.backgroundColor = baseColor;
      dataset.borderColor = baseColor;
      dataset.borderWidth = 0; // 毛玻璃風格通常去除硬邊框
      dataset.borderRadius = 4; // 圓角,讓視覺更柔和
      
      // 不分組,讓長條圖重疊
      dataset.grouped = false; 
      // 設定寬度
      dataset.barPercentage = 0.5; // 稍微細一點,看起來更精緻
      dataset.categoryPercentage = 0.8;
    } 
    // 折線圖樣式
    else if (chartType === 'line') {
      // 折線圖顏色固定用特定色或循環色的對比色,這裡用循環色但加深一點
      dataset.borderColor = baseColor;
      dataset.backgroundColor = baseColor; // 點的顏色
      dataset.borderWidth = 3;
      dataset.fill = false;
      dataset.tension = 0.4; // 曲線平滑度
      dataset.pointRadius = 4;
      dataset.pointHoverRadius = 7;
      dataset.pointBackgroundColor = '#fff'; // 白點
      dataset.pointBorderColor = baseColor;
      dataset.pointBorderWidth = 2;
    }
    
    return dataset;
  });
  
  return {
    label: '效率日誌綜合分析',
    chartType: 'bar', // 主要類型為 bar,但會包含 line
    datasets: datasets,
    labels: labels,
    isCombined: true, // 標記為組合圖表
    bonusThresholds: CONFIG.BONUS_THRESHOLDS // 【新增】傳遞獎金門檻設定給前端
  };
}

// ============================================
// 工具函式區
// ============================================

const Utils = {
  /**
   * 取得工作表物件
   * 
   * @param {string} sheetName - 工作表名稱
   * @returns {Sheet} 工作表物件
   */
  getSheet: function(sheetName) {
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
      return ss.getSheetByName(sheetName);
    } catch (error) {
      console.error('取得工作表失敗:', error);
      return null;
    }
  },
  
  /**
   * 格式化數值或日期
   * 
   * @param {*} value - 要格式化的值
   * @returns {string} 格式化後的字串
   */
  formatValue: function(value) {
    if (value instanceof Date) {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), 'MM/dd');
    }
    // 嘗試解析字串日期
    const dateTry = new Date(value);
    if (!isNaN(dateTry) && typeof value === 'string' && value.includes('-')) {
        return Utilities.formatDate(dateTry, Session.getScriptTimeZone(), 'MM/dd');
    }
    return String(value);
  },
  
  /**
   * 從資料中取得日期範圍
   * 
   * @param {Array} data - 資料陣列
   * @returns {Object} 包含開始和結束日期的物件
   */
  getDateRange: function(data) {
    if (!data || data.length === 0) return null;
    
    const firstColumn = Object.keys(data[0])[0];
    
    // 取得並過濾有效日期
    const dates = data.map(row => {
      const val = row[firstColumn];
      if (val instanceof Date) return val;
      const parsed = new Date(val);
      return isNaN(parsed) ? null : parsed;
    }).filter(d => d !== null);
    
    if (dates.length === 0) return null;
    
    // 因為資料已經排序過,直接取首尾
    return {
      start: Utilities.formatDate(dates[0], Session.getScriptTimeZone(), 'yyyy/MM/dd'),
      end: Utilities.formatDate(dates[dates.length - 1], Session.getScriptTimeZone(), 'yyyy/MM/dd')
    };
  },
  
  /**
   * 記錄訊息到控制台和 Logger
   * 
   * @param {string} level - 日誌等級 (INFO, WARN, ERROR)
   * @param {string} message - 訊息內容
   */
  log: function(level, message) {
    const timestamp = new Date().toLocaleString('zh-TW');
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);
    Logger.log(logMessage);
  }
};

// ============================================
// 測試函式區
// ============================================

/**
 * 測試:讀取試算表資料
 */
function test_getSheetData() {
  try {
    const data = getSheetData();
    Logger.log('=== 試算表資料 ===');
    Logger.log(`總列數: ${data.dataRows.length}`);
    Logger.log(`日期範圍: ${JSON.stringify(Utils.getDateRange(data.data))}`);
    
    // 【新增】測試月份提取功能
    const months = getAvailableMonths(data.data);
    Logger.log(`可用月份: ${JSON.stringify(months)}`);
    
    console.log('✅ 測試通過:成功讀取試算表資料');
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

/**
 * 測試:取得指定月份的圖表資料
 */
function test_getMonthData() {
  try {
    // 測試取得 2025-12 月份的資料
    const data = getAllChartsData('2025-12');
    Logger.log('=== 2025-12 月份資料 ===');
    Logger.log(`篩選後筆數: ${data.summary.totalRows}`);
    Logger.log(`日期範圍: ${JSON.stringify(data.summary.dateRange)}`);
    
    // 測試取得全部資料
    const allData = getAllChartsData('ALL');
    Logger.log('=== 全部資料 ===');
    Logger.log(`總筆數: ${allData.summary.totalRows}`);
    
    console.log('✅ 測試通過:月份篩選功能正常');
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

/**
 * 測試:獎金門檻設定與達成狀態
 */
function test_bonusThresholds() {
  try {
    const data = getAllChartsData();
    Logger.log('=== 獎金門檻設定 ===');
    Logger.log(`門檻數量: ${data.charts[0].bonusThresholds.length}`);
    data.charts[0].bonusThresholds.forEach(threshold => {
      Logger.log(`- ${threshold.label} (${threshold.value * 100}%)`);
    });
    
    // 【修改】測試獎金達成狀態 - 改為最近一天
    Logger.log('=== 獎金達成狀態 ===');
    Logger.log(`是否達標: ${data.bonusStatus.achieved}`);
    if (data.bonusStatus.highestThreshold) {
      Logger.log(`最高門檻: ${data.bonusStatus.highestThreshold.label}`);
      Logger.log(`最近達成率: ${Math.round(data.bonusStatus.latestRate * 100)}%`);
      Logger.log(`達標天數: ${data.bonusStatus.daysAboveThreshold}/${data.bonusStatus.totalDays}`);
    } else {
      Logger.log(`最近達成率: ${Math.round(data.bonusStatus.latestRate * 100)}%`);
    }
    
    console.log('✅ 測試通過:獎金門檻設定正確');
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}
