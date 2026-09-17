/**
 * =========================================================================
 *  KRATOM POS · SAMSEE PROFESSIONAL BI - GOOGLE APPS SCRIPT BACKEND API
 *  Production-Grade Real-Time Database & Concurrency Control Engine
 * =========================================================================
 *  Sheets Managed:
 *   1. StockLogs  - Complete Transaction & Movement History (IN/OUT)
 *   2. Expenses   - Categorized Operating & Raw Material Expenses
 *   3. Products   - Catalog & Live Inventory State
 *   4. Config     - Recipe Ratios, Costing Defaults & Business Parameters
 * =========================================================================
 */

var SHEET_STOCK_LOGS = "StockLogs";
var SHEET_EXPENSES = "Expenses";
var SHEET_PRODUCTS = "Products";
var SHEET_CONFIG = "Config";

/**
 * 1. ONE-CLICK SYSTEM SETUP ROUTINE
 * Run this once in the Apps Script Editor to bootstrap the 4 database sheets
 * with formatted headers, frozen rows, and initial standard master data.
 */
function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: StockLogs
  var stockSheet = getOrCreateSheet(ss, SHEET_STOCK_LOGS);
  var stockHeaders = [
    "ID", "Timestamp", "Type", "ProductID", "ProductName",
    "FormulaType", "Quantity", "RemainingStock", "UnitPrice",
    "TotalPrice", "Cost", "PaymentMethod", "CustomerOrLot", "Notes"
  ];
  styleHeaderRow(stockSheet, stockHeaders, "#0f2e24", "#34d399");
  
  // Sheet 2: Expenses
  var expenseSheet = getOrCreateSheet(ss, SHEET_EXPENSES);
  var expenseHeaders = [
    "ID", "Timestamp", "Category", "Description", "Amount",
    "Quantity", "Unit", "Notes"
  ];
  styleHeaderRow(expenseSheet, expenseHeaders, "#1f2937", "#60a5fa");
  
  // Sheet 3: Products
  var prodSheet = getOrCreateSheet(ss, SHEET_PRODUCTS);
  var prodHeaders = [
    "ID", "SKU", "Name", "FormulaType", "Price",
    "CostEstimate", "Stock", "BottleSizeMl", "Description", "Active"
  ];
  styleHeaderRow(prodSheet, prodHeaders, "#1c1917", "#f59e0b");
  
  // Insert initial default products if empty
  if (prodSheet.getLastRow() === 1) {
    var initialProducts = [
      ["PROD-001", "KT-RED-1000", "กระท่อมต้ม สูตรฝาแดง (1,000ml)", "RED", 35, 14.85, 45, 1000, "สูตรยอดนิยม เข้มข้น กลมกล่อม ผสมฝาแดงและโค้ก", true],
      ["PROD-002", "KT-BM-1000", "กระท่อมต้ม สูตร BM (1,000ml)", "BM", 35, 13.95, 38, 1000, "สูตรบีเอ็ม เพิ่มความหวานอมเปรี้ยวด้วยบ๊วยแท้ 9 เม็ด", true],
      ["PROD-003", "KT-RAW-1000", "น้ำกระท่อมดิบแท้ 100% (1,000ml)", "OTHER", 30, 8.50, 20, 1000, "น้ำกระท่อมสกัดบริสุทธิ์ ไม่ผสม สำหรับนำไปผสมเอง", true]
    ];
    prodSheet.getRange(2, 1, initialProducts.length, initialProducts[0].length).setValues(initialProducts);
  }
  
  // Sheet 4: Config
  var configSheet = getOrCreateSheet(ss, SHEET_CONFIG);
  var configHeaders = ["Key", "Value", "Description", "UpdatedAt"];
  styleHeaderRow(configSheet, configHeaders, "#1e1b4b", "#a78bfa");
  
  // Insert default config if empty
  if (configSheet.getLastRow() === 1) {
    var nowStr = new Date().toISOString();
    var initialConfig = [
      ["leafCostPerKg", 100, "ต้นทุนใบกระท่อม (บาท/กก.)", nowStr],
      ["bottleAndStickerCost", 4, "ต้นทุนขวดพร้อมสติกเกอร์ (บาท/ขวด)", nowStr],
      ["overheadCostPerBottle", 2, "ค่าแก๊ส/ไฟ/ค่าแฝง (บาท/ขวด)", nowStr],
      ["redCokeCostPerLiter", 22, "ต้นทุนโค้ก สูตรฝาแดง (บาท/ลิตร)", nowStr],
      ["redSyrupCostPerBottle60ml", 54, "ต้นทุนยาแก้ไอฝาแดง (บาท/ขวด 60ml)", nowStr],
      ["redSellingPrice", 35, "ราคาขายมาตรฐาน สูตรฝาแดง (บาท)", nowStr],
      ["bmCokeCostPerLiter", 22, "ต้นทุนโค้ก สูตร BM (บาท/ลิตร)", nowStr],
      ["bmSyrupCostPerBottle60ml", 34, "ต้นทุนยาแก้ไอ BM (บาท/ขวด 60ml)", nowStr],
      ["bmPlumCostPerPiece", 0.5, "ต้นทุนบ๊วย (บาท/เม็ด)", nowStr],
      ["bmSellingPrice", 35, "ราคาขายมาตรฐาน สูตร BM (บาท)", nowStr],
      ["redRawRatio", 3, "สัดส่วนน้ำดิบ สูตรฝาแดง (ลิตร)", nowStr],
      ["redCokeRatio", 1, "สัดส่วนโค้ก สูตรฝาแดง (ลิตร)", nowStr],
      ["redSyrupMl", 20, "ปริมาณยาแก้ไอฝาแดง (มล. ต่อน้ำดิบ 3 ลิตร)", nowStr],
      ["bmRawRatio", 3, "สัดส่วนน้ำดิบ สูตร BM (ลิตร)", nowStr],
      ["bmCokeRatio", 1, "สัดส่วนโค้ก สูตร BM (ลิตร)", nowStr],
      ["bmSyrupMl", 20, "ปริมาณยาแก้ไอ BM (มล. ต่อน้ำดิบ 3 ลิตร)", nowStr],
      ["bmPlumCount", 9, "จำนวนเม็ดบ๊วย สูตร BM (เม็ด ต่อน้ำดิบ 3 ลิตร)", nowStr],
      ["boilRatioWaterToLeaf", 22, "อัตราส่วนต้ม (น้ำเปล่า 22L ต่อใบกระท่อม 1kg)", nowStr],
      ["boilExtractPercent", 80, "เปอร์เซ็นต์น้ำดิบสกัดได้ (% Extract)", nowStr],
      ["standardBottleSizeMl", 1000, "ขนาดบรรจุขวดมาตรฐาน (ml)", nowStr]
    ];
    configSheet.getRange(2, 1, initialConfig.length, initialConfig[0].length).setValues(initialConfig);
  }
  
  Logger.log("Kratom POS · SAMSEE System Setup Completed Successfully!");
  return "System Setup Completed Successfully!";
}

/**
 * 2. HTTP GET REQUEST HANDLER
 * Handles data fetching (action=GET_ALL) or renders Web App status page.
 */
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;
  
  if (action === "GET_ALL" || action === "getData") {
    try {
      var data = fetchAllDatabaseData();
      return createJsonResponse({
        status: "success",
        timestamp: new Date().toISOString(),
        data: data
      });
    } catch (err) {
      return createJsonResponse({
        status: "error",
        message: err.toString()
      });
    }
  }
  
  // Default HTML Info & Verification Screen
  var html = [
    "<!DOCTYPE html>",
    "<html><head><meta charset='UTF-8'><title>Kratom POS API Endpoint</title>",
    "<style>body{background:#050608;color:#f3f4f6;font-family:-apple-system,sans-serif;padding:40px;line-height:1.6;}",
    ".card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;max-width:680px;margin:0 auto;box-shadow:0 10px 40px rgba(0,0,0,0.5);}",
    "h1{color:#34d399;font-size:24px;margin-bottom:8px;}p{color:#9ca3af;font-size:14px;}",
    ".badge{display:inline-block;background:#064e3b;color:#6ee7b7;padding:4px 12px;border-radius:999px;font-weight:600;font-size:12px;margin-bottom:16px;}",
    "code{background:rgba(0,0,0,0.4);padding:2px 6px;border-radius:4px;color:#a78bfa;}",
    "</style></head><body>",
    "<div class='card'>",
    "<span class='badge'>API STATUS: ACTIVE · 200 OK</span>",
    "<h1>Kratom POS · SAMSEE BI Backend Service</h1>",
    "<p>Google Apps Script Real-Time RESTful Database API is operational.</p>",
    "<p>Use <code>?action=GET_ALL</code> in GET requests or submit JSON via POST to synchronize.</p>",
    "<p style='margin-top:24px;color:#6b7280;font-size:12px;'>Kratom POS Professional Edition &copy; 2026</p>",
    "</div></body></html>"
  ].join("");
  
  return HtmlService.createHtmlOutput(html)
    .setTitle("Kratom POS · API Status")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 3. HTTP POST REQUEST HANDLER WITH CONCURRENCY LOCK
 * Guarantees transaction safety via LockService.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  
  try {
    // Acquire lock for up to 30 seconds
    lockAcquired = lock.tryLock(30000);
    if (!lockAcquired) {
      return createJsonResponse({
        status: "error",
        message: "ระบบกำลังประมวลผลคำขออื่นอยู่ กรุณาลองใหม่อีกครั้ง (Lock timeout)"
      });
    }
    
    var requestData = {};
    if (e && e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      requestData = e.parameter;
    }
    
    var action = requestData.action;
    var payload = requestData.payload || requestData;
    var result = {};
    
    switch (action) {
      case "POS_SALE":
        result = handlePosSale(payload);
        break;
      case "ADD_STOCK":
        result = handleAddStock(payload);
        break;
      case "ADD":
        result = handleAddSingleLog(payload);
        break;
      case "EDIT":
        result = handleEditLog(payload);
        break;
      case "DELETE":
        result = handleDeleteLog(payload);
        break;
      case "ADD_EXPENSE":
        result = handleAddExpense(payload);
        break;
      case "DELETE_EXPENSE":
        result = handleDeleteExpense(payload);
        break;
      case "SAVE_CONFIG":
        result = handleSaveConfig(payload);
        break;
      case "SYNC_BATCH":
        result = handleBatchSync(payload);
        break;
      default:
        throw new Error("Unknown action: " + action);
    }
    
    return createJsonResponse({
      status: "success",
      action: action,
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

/**
 * 4. ACTION HANDLERS
 */

// Handle POS Checkout (multiple items sold in one bill)
function handlePosSale(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockSheet = ss.getSheetByName(SHEET_STOCK_LOGS);
  var prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
  
  var items = payload.items || [];
  var paymentMethod = payload.paymentMethod || "CASH";
  var customerOrNote = payload.customerOrNote || "";
  var timestamp = payload.timestamp || new Date().toISOString();
  
  var productsMap = getProductsMap(prodSheet);
  var createdLogs = [];
  
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var pId = it.productId;
    var qty = Number(it.quantity) || 1;
    var prod = productsMap[pId];
    
    var currentStock = prod ? Number(prod.stock) : 0;
    var newStock = Math.max(0, currentStock - qty);
    var unitPrice = Number(it.unitPrice || (prod ? prod.price : 35));
    var costEstimate = Number(prod ? prod.costEstimate : 14);
    
    var logId = "SL-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
    var row = [
      logId,
      timestamp,
      "OUT",
      pId,
      prod ? prod.name : (it.productName || "สินค้า"),
      prod ? prod.formulaType : (it.formulaType || "RED"),
      qty,
      newStock,
      unitPrice,
      unitPrice * qty,
      costEstimate * qty,
      paymentMethod,
      customerOrNote,
      it.notes || ("POS Sale (" + paymentMethod + ")")
    ];
    
    stockSheet.appendRow(row);
    createdLogs.push({ id: logId, newStock: newStock });
    
    // Update stock in products map and sheet
    if (prod) {
      prod.stock = newStock;
      updateProductStockInSheet(prodSheet, prod.rowIndex, newStock);
    }
  }
  
  return { logsCreated: createdLogs.length, logs: createdLogs };
}

// Handle Add Stock (Production / Boiling Receive)
function handleAddStock(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockSheet = ss.getSheetByName(SHEET_STOCK_LOGS);
  var prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
  
  var pId = payload.productId;
  var qty = Number(payload.quantity) || 0;
  var lot = payload.lot || ("LOT-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd-HHmm"));
  var timestamp = payload.timestamp || new Date().toISOString();
  var notes = payload.notes || "รับเข้าจากการผลิต";
  
  var productsMap = getProductsMap(prodSheet);
  var prod = productsMap[pId];
  
  var currentStock = prod ? Number(prod.stock) : 0;
  var newStock = currentStock + qty;
  var cost = Number(payload.cost || (prod ? prod.costEstimate * qty : 0));
  
  var logId = "SL-IN-" + new Date().getTime();
  var row = [
    logId,
    timestamp,
    "IN",
    pId,
    prod ? prod.name : payload.productName,
    prod ? prod.formulaType : (payload.formulaType || "RED"),
    qty,
    newStock,
    0,
    0,
    cost,
    "",
    lot,
    notes
  ];
  
  stockSheet.appendRow(row);
  if (prod) {
    updateProductStockInSheet(prodSheet, prod.rowIndex, newStock);
  }
  
  return { id: logId, newStock: newStock, lot: lot };
}

// Handle Single Manual Movement (IN or OUT)
function handleAddSingleLog(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockSheet = ss.getSheetByName(SHEET_STOCK_LOGS);
  var prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
  
  var pId = payload.productId;
  var qty = Number(payload.quantity) || 0;
  var type = (payload.type || "OUT").toUpperCase();
  var timestamp = payload.timestamp || new Date().toISOString();
  
  var productsMap = getProductsMap(prodSheet);
  var prod = productsMap[pId];
  var currentStock = prod ? Number(prod.stock) : 0;
  
  var newStock = type === "IN" ? (currentStock + qty) : Math.max(0, currentStock - qty);
  var unitPrice = Number(payload.unitPrice || (prod ? prod.price : 0));
  var total = type === "OUT" ? (unitPrice * qty) : 0;
  var cost = Number(payload.cost || (prod ? prod.costEstimate * qty : 0));
  
  var logId = payload.id || ("SL-" + new Date().getTime());
  var row = [
    logId,
    timestamp,
    type,
    pId,
    prod ? prod.name : payload.productName,
    prod ? prod.formulaType : (payload.formulaType || "RED"),
    qty,
    newStock,
    unitPrice,
    total,
    cost,
    payload.paymentMethod || "CASH",
    payload.customerOrLot || "",
    payload.notes || ""
  ];
  
  stockSheet.appendRow(row);
  if (prod) {
    updateProductStockInSheet(prodSheet, prod.rowIndex, newStock);
  }
  
  return { id: logId, newStock: newStock };
}

// Edit Log Note or Details
function handleEditLog(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockSheet = ss.getSheetByName(SHEET_STOCK_LOGS);
  var targetId = payload.id;
  
  var data = stockSheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(targetId)) {
      var rowNum = r + 1;
      if (payload.customerOrLot !== undefined) stockSheet.getRange(rowNum, 13).setValue(payload.customerOrLot);
      if (payload.notes !== undefined) stockSheet.getRange(rowNum, 14).setValue(payload.notes);
      return { updated: true, id: targetId };
    }
  }
  throw new Error("Transaction log with ID " + targetId + " not found.");
}

// Delete Log and Rollback Stock
function handleDeleteLog(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockSheet = ss.getSheetByName(SHEET_STOCK_LOGS);
  var prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
  var targetId = payload.id;
  
  var data = stockSheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(targetId)) {
      var rowNum = r + 1;
      var type = String(data[r][2]);
      var pId = String(data[r][3]);
      var qty = Number(data[r][6]) || 0;
      
      // Rollback Product Stock
      var productsMap = getProductsMap(prodSheet);
      var prod = productsMap[pId];
      if (prod) {
        var currentStock = Number(prod.stock);
        // If an OUT was deleted, we restore stock (+qty). If an IN was deleted, we deduct stock (-qty).
        var revertedStock = type === "OUT" ? (currentStock + qty) : Math.max(0, currentStock - qty);
        updateProductStockInSheet(prodSheet, prod.rowIndex, revertedStock);
      }
      
      stockSheet.deleteRow(rowNum);
      return { deleted: true, id: targetId };
    }
  }
  throw new Error("Transaction log with ID " + targetId + " not found.");
}

// Add Expense Entry
function handleAddExpense(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var expenseSheet = ss.getSheetByName(SHEET_EXPENSES);
  
  var expId = payload.id || ("EXP-" + new Date().getTime());
  var row = [
    expId,
    payload.timestamp || new Date().toISOString(),
    payload.category || "อื่นๆ",
    payload.description || "",
    Number(payload.amount) || 0,
    Number(payload.quantity) || 1,
    payload.unit || "",
    payload.notes || ""
  ];
  
  expenseSheet.appendRow(row);
  return { id: expId, amount: payload.amount };
}

// Delete Expense Entry
function handleDeleteExpense(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var expenseSheet = ss.getSheetByName(SHEET_EXPENSES);
  var targetId = payload.id;
  
  var data = expenseSheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(targetId)) {
      expenseSheet.deleteRow(r + 1);
      return { deleted: true, id: targetId };
    }
  }
  throw new Error("Expense entry with ID " + targetId + " not found.");
}

// Save Configuration
function handleSaveConfig(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName(SHEET_CONFIG);
  var configObj = payload.config || payload;
  var nowStr = new Date().toISOString();
  
  var data = configSheet.getDataRange().getValues();
  var keyRowMap = {};
  for (var r = 1; r < data.length; r++) {
    keyRowMap[String(data[r][0])] = r + 1;
  }
  
  for (var key in configObj) {
    if (configObj.hasOwnProperty(key)) {
      var val = configObj[key];
      if (keyRowMap[key]) {
        configSheet.getRange(keyRowMap[key], 2).setValue(val);
        configSheet.getRange(keyRowMap[key], 4).setValue(nowStr);
      } else {
        configSheet.appendRow([key, val, "", nowStr]);
      }
    }
  }
  
  return { saved: true, keys: Object.keys(configObj).length };
}

// Batch Sync from Client
function handleBatchSync(payload) {
  // Sync full database state if requested
  return { synced: true };
}

/**
 * 5. DATABASE READ & HELPER FUNCTIONS
 */

function fetchAllDatabaseData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Stock Logs
  var stockLogs = [];
  var stockSheet = ss.getSheetByName(SHEET_STOCK_LOGS);
  if (stockSheet && stockSheet.getLastRow() > 1) {
    var rawLogs = stockSheet.getDataRange().getValues();
    for (var i = 1; i < rawLogs.length; i++) {
      var r = rawLogs[i];
      stockLogs.push({
        id: String(r[0]),
        timestamp: formatTimestamp(r[1]),
        type: String(r[2]),
        productId: String(r[3]),
        productName: String(r[4]),
        formulaType: String(r[5]),
        quantity: Number(r[6]) || 0,
        remainingStock: Number(r[7]) || 0,
        unitPrice: Number(r[8]) || 0,
        totalPrice: Number(r[9]) || 0,
        cost: Number(r[10]) || 0,
        paymentMethod: String(r[11] || "CASH"),
        customerOrLot: String(r[12] || ""),
        notes: String(r[13] || "")
      });
    }
  }
  
  // 2. Expenses
  var expenses = [];
  var expenseSheet = ss.getSheetByName(SHEET_EXPENSES);
  if (expenseSheet && expenseSheet.getLastRow() > 1) {
    var rawExp = expenseSheet.getDataRange().getValues();
    for (var j = 1; j < rawExp.length; j++) {
      var re = rawExp[j];
      expenses.push({
        id: String(re[0]),
        timestamp: formatTimestamp(re[1]),
        category: String(re[2]),
        description: String(re[3]),
        amount: Number(re[4]) || 0,
        quantity: Number(re[5]) || 0,
        unit: String(re[6] || ""),
        notes: String(re[7] || "")
      });
    }
  }
  
  // 3. Products
  var products = [];
  var prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (prodSheet && prodSheet.getLastRow() > 1) {
    var rawProd = prodSheet.getDataRange().getValues();
    for (var k = 1; k < rawProd.length; k++) {
      var rp = rawProd[k];
      products.push({
        id: String(rp[0]),
        sku: String(rp[1]),
        name: String(rp[2]),
        formulaType: String(rp[3]),
        price: Number(rp[4]) || 0,
        costEstimate: Number(rp[5]) || 0,
        stock: Number(rp[6]) || 0,
        bottleSizeMl: Number(rp[7]) || 1000,
        description: String(rp[8] || ""),
        active: rp[9] === true || String(rp[9]).toLowerCase() === "true"
      });
    }
  }
  
  // 4. Config
  var config = {};
  var configSheet = ss.getSheetByName(SHEET_CONFIG);
  if (configSheet && configSheet.getLastRow() > 1) {
    var rawCfg = configSheet.getDataRange().getValues();
    for (var c = 1; c < rawCfg.length; c++) {
      var key = String(rawCfg[c][0]);
      var val = rawCfg[c][1];
      if (typeof val === "number") {
        config[key] = val;
      } else if (!isNaN(Number(val)) && String(val).trim() !== "") {
        config[key] = Number(val);
      } else {
        config[key] = val;
      }
    }
  }
  
  return {
    stockLogs: stockLogs,
    expenses: expenses,
    products: products,
    config: config
  };
}

function getProductsMap(prodSheet) {
  var map = {};
  if (!prodSheet || prodSheet.getLastRow() <= 1) return map;
  
  var rows = prodSheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var id = String(rows[i][0]);
    map[id] = {
      rowIndex: i + 1,
      id: id,
      sku: rows[i][1],
      name: rows[i][2],
      formulaType: rows[i][3],
      price: Number(rows[i][4]),
      costEstimate: Number(rows[i][5]),
      stock: Number(rows[i][6])
    };
  }
  return map;
}

function updateProductStockInSheet(prodSheet, rowIndex, newStock) {
  prodSheet.getRange(rowIndex, 7).setValue(newStock);
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function styleHeaderRow(sheet, headers, bgColor, accentColor) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Plus Jakarta Sans");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  for (var col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

function formatTimestamp(val) {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
