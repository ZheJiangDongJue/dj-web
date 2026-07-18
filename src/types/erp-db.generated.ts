// 此文件由 scripts/generate-erp-db-types.cjs 自动生成，请勿手动修改。
// 源：ERP_csharp/ERP.Db
// 生成时间：2026-01-29T15:56:48.384Z

/* eslint-disable */

// 外部基类占位：Record
export class ErpRecord {
  /**
   * 兼容 IUniqueEntity：部分实体继承 Record 并实现 IUniqueEntity（Uid 在基类中提供）。
   */
  Uid!: number;
  /**
   * 占位基类：源于 ERP 外部程序集，仅用于保持继承关系。
   */
  initDefaults(): void {}
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ARAP/AccountType.cs
export enum AccountType {
  现金账户,
  银行账户,
  承兑账户,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/Alignment.cs
export enum Alignment {
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Approval/ApprovalFlowBehaviorParameter.cs
export enum ApprovalFlowBehaviorParameter {
  Undefined,
  CheckInventory,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Approval/ApprovalMechanisms.cs
export enum ApprovalMechanisms {
  Any  = 0,
  All  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Approval/ApprovalState.cs
export enum ApprovalState {
  Undefined,
  Pass,
  NotPass,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/AssociatedFeature.cs
export enum AssociatedFeature {
  不会因为我存在而拦截上游反审批  = 1 << 8,
  会因为我已审批而拦截上游反审批  = 1 << 9,
  删除时同时尝试删除下游  = 1 << 16,
  允许上游删除时同时删除自身  = 1 << 17,
  反审批时同时尝试删除下游  = 1 << 24,
  允许上游反审批时同时删除自身  = 1 << 25,
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/BatchFlowShuntConfig.cs
export enum BatchFlowShuntConfigFeature {
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/BillShuntConfig.cs
export enum BillFeature {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/BusinessEnum/BillStatus.cs
export enum BillStatus {
  未审批  = 0,
  已审批  = 1 << 0,
  已冻结  = 1 << 1,
  已结案  = 1 << 2,
  已作废  = 1 << 3,
  审批中  = 1 << 4,
  已中止  = 1 << 5,
  被驳回  = 1 << 6,
  已确认  = 1 << 7,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/BillTriggerMode.cs
export enum BillTriggerMode {
  None  = 0,
  数量字段默认值为1  = 1 << 0,
  允许空明细  = 1 << 1,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/BringProcess.cs
export enum BringProcess {
  组装完工单带工艺  = 1,
  装盒完工单带工艺  = 2,
  装盒完工单附属条码带工艺  = 16,
  日计划带工艺  = 128,
  挤出计划带工艺  = 256,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/ChangeTimeType.cs
export enum ChangeTimeType {
  None,
  前,
  后,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ChangeType.cs
export enum ChangeType {
  Undefined  = 0,
  Plus  = 1,
  Minus  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ChannelConfigMode.cs
export enum ChannelConfigMode {
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ChannelQuantityControlMode.cs
export enum ChannelQuantityControlMode {
  不控制  = 0,
  完全控制数量  = 1,
  依据采购超收发率控制  = 2,
  依据生产超收发率控制  = 4,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ChannelTarget.cs
export enum ChannelTarget {
  目标,
  源,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/EmployeeEnums/CheckResult.cs
export enum CheckResult {
  合格  = 1,
  让步接收  = 2,
  不合格  = 4,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ClientSpecialNeeds.cs
export enum ClientSpecialNeeds {
  需装箱_追溯  = 1,
  需装箱  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/CodingRuleValueType.cs
export enum CodingRuleValueType {
  Field  = 0,
  Const  = 1,
  SerialNumberForYear  = 2,
  SerialNumberForMonth  = 3,
  SerialNumberForDay  = 4,
  SerialNumberForForever  = 5,
  SerialNumberForAuxiliary  = 6,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/ColumnSortMode.cs
export enum ColumnSortMode {
  Default  = 0,
  Value  = 1,
  DisplayText  = 2,
  Custom  = 3,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/ConditionRule.cs
export enum ConditionRule {
  None,
  Equal,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/IOT/ConnectType.cs
export enum ConnectType {
  None  = 0,
  TCP  = 1,
  UDP  = 2,
  SerialPort  = 50,
  ModbusTCP  = 100,
  ModbusUDP  = 101,
  ModbusRTU  = 102,
  ModbusRTUOverTCP  = 103,
  ModbusASCII  = 104,
  PLCForSiemens  = 200,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ControlGeneralLocation.cs
export enum ControlGeneralLocation {
  Center,
  Left,
  Top,
  Right,
  Bottom,
  LeftLeft,
  TopTop,
  RightRight,
  BottomBottom,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/ControlMode.cs
export enum ControlMode {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/ControlType.cs
export enum ControlType {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/CSharpType.cs
export enum CSharpType {
  None  = 0,
  Byte  = 1,
  SByte  = 2,
  Short  = 3,
  UShort  = 4,
  Int  = 5,
  UInt  = 6,
  Long  = 7,
  ULong  = 8,
  Float  = 9,
  Double  = 10,
  Decimal  = 11,
  Bool  = 12,
  Char  = 13,
  String  = 14,
  DateTime  = 15,
  Bytes  = 16,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DataFieldMode.cs
export enum DataFieldMode {
  None  = 0,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/DataGridFeature.cs
export enum DataGridFeature {
  None  = 0,
  一级明细  = 1,
  二级明细  = 2,
  库存明细  = 3,
  汇总明细  = 4,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DataGridMode.cs
export enum DataGridMode {
  AllowDelete  = 1,
  AllowDragAndDrop  = 2,
  AllowBatchModify  = 8,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/DataRegionType.cs
export enum DataRegionType {
  SecondaryDataRegion  = 2,
  SecondaryDataRegion2  = 4,
  ContractTemplate  = 8,
  ApprovalFlowInstance  = 16,
  AttachedBarcode  = 32,
  ProcessInifo  = 64,
  Children  = 128,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DataUpdateTag.cs
export enum DataUpdateTag {
  数据高频变动  = 0,
  数据基本无变化  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/DataViewMode.cs
export enum DataViewMode {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DataViewType.cs
export enum DataViewType {
  None,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DataWriteMode.cs
export enum DataWriteMode {
  None  = 0,
  值取反  = 1 << 0,
  覆盖而非浮动  = 1 << 1,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DataWriteRulePresetFunctions.cs
export enum DataWriteRulePresetFunctions {
  完成上游受订量  = 1 << 0,
  完成上游预产量  = 1 << 1,
  完成上游在产量  = 1 << 2,
  完成上游在途量  = 1 << 3,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DataWriteTiming.cs
export enum DataWriteTiming {
  None  = 0,
  Saveing  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/DateTimeFilterType.cs
export enum DateTimeFilterType {
  Default,
  Range,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Error/Record/RecordErrorCode.cs
export enum DbRecordErrorCode {
  操作的数据不存在  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ARAP/DebtType.cs
export enum DebtType {
  收,
  支,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/DocumentStatus.cs
export enum DocumentStatus {
  未审批  = 0x40000000,
  已审批  = 1,
  已冻结  = 2,
  已结案  = 4,
  已作废  = 8,
  审批中  = 16,
  已中止  = 32,
  被驳回  = 64,
  已确认  = 128,
  变更中  = 256,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/EffectGroup.cs
export enum EffectGroup {
  None  = 0,
  A  = 1,
  B  = 2,
  C  = 4,
  D  = 8,
  E  = 16,
  F  = 32,
  G  = 64,
  H  = 128,
  I  = 256,
  J  = 512,
  K  = 1024,
  L  = 2048,
  M  = 4096,
  N  = 8192,
  O  = 16384,
  P  = 32768,
  Q  = 65536,
  R  = 131072,
  S  = 262144,
  T  = 524288,
  U  = 1048576,
  V  = 2097152,
  W  = 4194304,
  X  = 8388608,
  Y  = 16777216,
  Z  = 33554432,
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/EmployeeFile.cs
export enum EmployeeFileType {
  职员照片  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/EnumControlType.cs
export enum EnumControlType {
  Text  = 0,
  StatusText  = 49,
  Svg  = 50,
  Image  = 51,
  SvgAndText  = 52,
  ImageAndText  = 53,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/FieldMappingMode.cs
export enum FieldMappingMode {
  None,
  当目标控件中不存在匹配行则创建新行,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/FieldMode.cs
export enum FieldMode {
  不能为空  = 1 << 0,
  在复制时不保留  = 1 << 1,
  该字段内容不允许和已有的数据重复  = 1 << 2,
  不参与检测被引用逻辑  = 1 << 10,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Craft/FlowParameter.cs
export enum FlowParameter {
  启用分卡  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryScrapDocument.cs
export enum FormStatus {
  无  = 1,
  已开  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/HongMao/FurnacePlacement.cs
export enum FurnacePlacement {
  上区  = 1,
  中区  = 2,
  下区  = 3,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/Gender.cs
export enum Gender {
  女  = 0,
  男  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/GeneratorBehavior.cs
export enum GenerateBehavior {
  None  = 0,
  NoDocument  = 1,
  NoDetail  = 2,
  AutoSplitToSecondaryDetails  = 4,
  AutoGenerate  = 8,
  DetailsGenerateDocuments  = 16,
  MultipleDocumentSameCustomer  = 32,
  DefaultQuantityEffect  = 64,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemGenerateRule.cs
export enum GenerateMode {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/ImageType.cs
export enum ImageType {
  None  = 0,
  Bitmap  = 1,
  Svg  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/InspectionRequired.cs
export enum InspectionRequired {
  采购收货检验  = 1,
  采购退货检验  = 2,
  日计划检验  = 4,
  销售发货检验  = 8,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/IntValue.cs
export enum IntValue {
  _0  = 0,
  _1  = 1,
  _2  = 2,
  _4  = 4,
  _8  = 8,
  _16  = 16,
  _32  = 32,
  _64  = 64,
  _128  = 128,
  _256  = 256,
  _512  = 512,
  _1024  = 1024,
  _2048  = 2048,
  _4096  = 4096,
  _8192  = 8192,
  _16384  = 16384,
  _32768  = 32768,
  _65536  = 65536,
  _131072  = 131072,
  _262144  = 262144,
  _524288  = 524288,
  _1048576  = 1048576,
  _2097152  = 2097152,
  _4194304  = 4194304,
  _8388608  = 8388608,
  _16777216  = 16777216,
  _33554432  = 33554432,
  _67108864  = 67108864,
  _134217728  = 134217728,
  _268435456  = 268435456,
  _536870912  = 536870912,
  _1073741824  = 1073741824,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/InventoryBehavior.cs
export enum InventoryBehavior {
  不影响  = 0,
  作为一级时正影响库存  = 1,
  作为一级时负影响库存  = 2,
  不作为一级时正影响库存  = 4,
  不作为一级时负影响库存  = 8,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/InventoryForDocumentConfig.cs
export enum InventoryForDocumentConfig {
  无  = 0,
  正影响主要明细  = 1,
  负影响主要明细  = 2,
  正影响二级明细  = 4,
  负影响二级明细  = 8,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/InventoryType.cs
export enum InventoryType {
  Undefined  = 0,
  Income  = 1,
  SendOut  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/ListItemTemplateType.cs
export enum ListItemTemplateType {
  None  = 0,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Check/MaterialCheckCaseType.cs
export enum MaterialCheckCaseType {
  Material  = 0,
  IncomingInspection  = 1,
  FinishedInspection  = 2,
  StockOut  = 3,
  FirstInspection  = 4,
  FinalInspection  = 5,
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/MaterialFile.cs
export enum MaterialFieldType {
  物料概览图  = 1,
  物料正视图  = 2,
  物料侧视图  = 3,
  物料俯视图  = 4,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/MinDataUpdateType.cs
export enum MinDataUpdateType {
  Insert,
  Update,
  Delete,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ApprovedChange/ModifyMode.cs
export enum ModifyMode {
  未定义  = 0,
  新增  = 1,
  修改  = 2,
  删除  = 3,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/MonitorMode.cs
export enum MonitorMode {
  None,
  OnlyRecordWhenDataChange,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/MutexGroup.cs
export enum MutexGroup {
  A  = 1,
  B  = 2,
  C  = 4,
  D  = 8,
  E  = 16,
  F  = 32,
  G  = 64,
  H  = 128,
  I  = 256,
  J  = 512,
  K  = 1024,
  L  = 2048,
  M  = 4096,
  N  = 8192,
  O  = 16384,
  P  = 32768,
  Q  = 65536,
  R  = 131072,
  S  = 262144,
  T  = 524288,
  U  = 1048576,
  V  = 2097152,
  W  = 4194304,
  X  = 8388608,
  Y  = 16777216,
  Z  = 33554432,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/NotifyEvent.cs
export enum NotifyEvent {
  Save  = 1,
  Approval  = 2,
  ReverseApproval  = 4,
  Closed  = 8,
  ReverseClosed  = 16,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/NotifyMode.cs
export enum NotifyMode {
  Email  = 0,
  SystemOfflineMessage  = 1,
  Wechat  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ObjectBaseType.cs
export enum ObjectBaseType {
  Document,
  Detail,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/OperatorSetter.cs
export enum OperatorSetter {
  IsAdmin  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/Orientation.cs
export enum Orientation {
  Horizontal,
  Vertical,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/OtherOptionForSystemSetting.cs
export enum OtherOptionForSystemSetting {
  升级账套时保留此设置  = 1,
  当作为单据时明细允许为空  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ARAP/OverCollectionMode.cs
export enum OverCollectionMode {
  空值,
  转预收,
  转溢收,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ARAP/OverpaymentMode.cs
export enum OverpaymentMode {
  空值,
  转预付,
  转溢付,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/PackConfig.cs
export enum PackConfig {
  是装盒物料  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/PageMainTypeBelongTo.cs
export enum PageMainTypeBelongTo {
  Undefined,
  Document,
  Object,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/PageMode.cs
export enum PageMode {
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/PageUsage.cs
export enum PageUsage {
  Undefined,
  Editor,
  Viewer,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/PageVersionType.cs
export enum PageVersionType {
  Old,
  WPFNative,
  Iterate,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/IOT/Parity.cs
export enum Parity {
  None,
  Odd,
  Even,
  Mark,
  Space,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/Permissions.cs
export enum Permissions {
  浏览  = 0b00000000000000000000000000000001,
  新增  = 0b00000000000000000000000000000010,
  编辑  = 0b00000000000000000000000000000100,
  删除  = 0b00000000000000000000000000001000,
  占位1  = 0b00000000000000000000000000010000,
  占位2  = 0b00000000000000000000000000100000,
  占位3  = 0b00000000000000000000000001000000,
  占位4  = 0b00000000000000000000000010000000,
  启用  = 0b00000000000000000000000100000000,
  反启用  = 0b00000000000000000000001000000000,
  占位5  = 0b00000000000000000000010000000000,
  导出  = 0b00000000000000000000100000000000,
  打印  = 0b00000000000000000001000000000000,
  打印模板设计  = 0b00000000000000000010000000000000,
  安全数据可见  = 0b00000000000000000100000000000000,
  系统化设计  = 0b00000000000000001000000000000000,
  审批  = 0b00000000000000010000000000000000,
  反审批  = 0b00000000000000100000000000000000,
  已审变更  = 0b00000000000001000000000000000000,
  结案  = 0b00000000000010000000000000000000,
  反结案  = 0b00000000000100000000000000000000,
  冻结  = 0b00000000001000000000000000000000,
  解冻  = 0b00000000010000000000000000000000,
  确认  = 0b00000000100000000000000000000000,
  反确认  = 0b00000001000000000000000000000000,
  占位8  = 0b00000010000000000000000000000000,
  占位9  = 0b00000100000000000000000000000000,
  占位10  = 0b00001000000000000000000000000000,
  占位11  = 0b00010000000000000000000000000000,
  临时_明细中仓库可修改  = 0b00100000000000000000000000000000,
  安全数据可修改  = 0b01000000000000000000000000000000,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/Position.cs
export enum Position {
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/Privilege.cs
export enum Privilege {
  非审批流人员能直接反审批单据  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ProcessStatus.cs
export enum ProcessStatus {
  未开始  = 0,
  进行中  = 1,
  已完成  = 2,
  禁用  = 3,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ProcessType.cs
export enum ProcessType {
  特殊单据  = 1,
  不参与批量接收  = 2,
  不参与批量完工  = 4,
  需要首件  = 8,
  需要末件  = 16,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/PushBackMode.cs
export enum PushBackMode {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/QtyGenerateMode.cs
export enum QtyGenerateMode {
  产生受订量  = 1 << 0,
  产生预产量  = 1 << 1,
  产生在产量  = 1 << 2,
  产生在途量  = 1 << 3,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/QuantityControlMode.cs
export enum QuantityControlMode {
  不控制  = 0,
  严格控制数量  = 1,
  依据采购超收发率控制  = 2,
  依据生产超收发率控制  = 4,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemRangeRoleDetail.cs
export enum RangeRolePermissionEffectMode {
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProcessUnfinishedReasons.cs
export enum ReasonsFunctionType {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemBillRelation.cs
export enum RelationGroup {
  参与选择  = 1 << 0,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemBillRelation.cs
export enum RelationMode {
  正向  = 1 << 0,
  反向  = 1 << 1,
  直接反向  = 1 << 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Sales/ReplenishmentMode.cs
export enum ReplenishmentMode {
  需要补货  = 1,
  无需补货  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ReverseWriteMode.cs
export enum ReverseWriteMode {
  覆盖  = 1,
  重新合计  = 2,
  反写值取反  = 128,
  二级明细参与合计  = 256,
  取值需满足已审批  = 512,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ReverseWriteTarget.cs
export enum ReverseWriteTarget {
  目标,
  自己,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ReverseWriteTiming.cs
export enum ReverseWriteTiming {
  SaveAndDelete  = 1,
  ApprovalAndUnApproval  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/RoleEffect.cs
export enum RoleEffect {
  NotAffectedByBehaviorRole  = 1,
  NotAffectedByRangeRole  = 2,
  NotAffectedByFieldRole  = 4,
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryScrapDocument.cs
export enum ScrapType {
  无责  = 1,
  有责  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemScriptBind.cs
export enum ScriptType {
  Lua  = 0,
  VisualScript  = 1024,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemServerCommandTrigger.cs
export enum ServerEventTiming {
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Check/SeverityLevel.cs
export enum SeverityLevel {
  减量  = 1,
  正常  = 2,
  加严  = 3,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/Error/Spider/SmmPriceSpiderCode.cs
export enum SmmPriceSpiderCode {
  成功  = 0,
  时间格式错误  = 1,
  指定日期价格已收录  = 2,
  指定日期价格未收录  = 3,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SpecialFieldType.cs
export enum SpecialFieldType {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/IOT/StopBits.cs
export enum StopBits {
  None,
  One,
  Two,
  OnePointFive,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/SupplierType.cs
export enum SupplierType {
  正式,
  临时,
  备用,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/SysPageBehavior.cs
export enum SysPageBehavior {
  CanMultipleExist  = 1,
  RefreshDataWhenOpeningPage  = 2,
  FilterDataWhenOpeningPage  = 4,
  SupportCopyInsertion  = 8,
  IsNewFilterMethod  = 16,
  CurrentApprovalFlowPersonnelCanModifyDocumentsUnderApproval  = 32,
  NotHasCopyButtonInDocumentEditPage  = 64,
  DetailQtyInDocumentCanBeZero  = 128,
  CanNotAddBatchesFromInventory  = 256,
  SupportCopySelectedItems  = 512,
  CannotSelect  = 1024,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/TagFlags.cs
export enum TagFlags {
  A  = 0x1,
  B  = 0x2,
  C  = 0x4,
  D  = 0x8,
  E  = 0x10,
  F  = 0x20,
  G  = 0x40,
  H  = 0x80,
  I  = 0x100,
  J  = 0x200,
  K  = 0x400,
  L  = 0x800,
  M  = 0x1000,
  N  = 0x2000,
  O  = 0x4000,
  P  = 0x8000,
  Q  = 0x10000,
  R  = 0x20000,
  S  = 0x40000,
  T  = 0x80000,
  U  = 0x100000,
  V  = 0x200000,
  W  = 0x400000,
  X  = 0x800000,
  Y  = 0x1000000,
  Z  = 0x2000000,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemBillRelation.cs
export enum TestCompleted {
  完成上游受订量  = 1 << 0,
  完成上游预产量  = 1 << 1,
  完成上游在产量  = 1 << 2,
  完成上游在途量  = 1 << 3,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/TimeSpanUnit.cs
export enum TimeSpanUnit {
  秒  = 0,
  分  = 1,
  时  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/TreeViewMode.cs
export enum TreeViewMode {
  AllowDelete  = 1,
  AllowDragAndDrop  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/TypeSetting.cs
export enum TypeSetting {
  Normal  = 0,
  Bill  = 1,
  Detail  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/UserInterfaceType.cs
export enum UserInterfaceType {
  Unknown,
  Text,
  BoolText,
  MultiLineText,
  Check,
  Button,
  ComboBox,
  Number,
  SplitMoney,
  Date,
  DateTime,
  SimpleDateGroup,
  ComboBoxDbList,
  ComboBoxDbModelList,
  ComboBoxEnum,
  ComboBoxDict,
  ApprovalStatus,
  Path,
  Image,
  AutoComplete,
  DoubleStateForCheck,
  RadioButtonGroupH,
  RadioButtonGroupV,
  ComboBoxEnumV1,
  Control,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/UserTypeForAuthority.cs
export enum UserTypeForAuthority {
  操作员,
  角色,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/IOT/ValueTypeForModbus.cs
export enum ValueTypeForModbus {
  Coil,
  Discrete,
  Short,
  UShort,
  Int,
  Uint,
  Long,
  ULong,
  Float,
  Double,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/IOT/ValueTypeForPLC.cs
export enum ValueTypeForPLC {
  Bit,
  Byte,
  Short,
  UShort,
  Int,
  Uint,
  Long,
  ULong,
  Float,
  Double,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/SystemEnum/ViewFeatureType.cs
export enum ViewFeatureType {
  None  = 0,
  单据  = 1,
}

// 来自: ../ERP_csharp/ERP.Db/Enums/SystemMaintenance/ViewFieldBehavior.cs
export enum ViewFieldBehavior {
  IsMainField  = 0b1,
  IsSensitiveField  = 0b10,
  IsReadOnly  = 0b100,
  CanMultiSelect  = 0b1000,
  BindingItemsSourceToViewModel  = 0b10000,
  _______________  = 0b100000,
  CanNotBeNull  = 0b1000000,
  CanSum  = 0b10000000,
  ShowInComboBox  = 0b100000000,
  IsHide  = 0b1000000000,
  FreezeField  = 0b10000000000,
  CanNotResize  = 0b100000000000,
  IsMainStyleField  = 0b1000000000000,
  NotBePrint  = 0b10000000000000,
  CanNotInvokeValueChangedCommand  = 0b100000000000000,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Enums/ViewType.cs
export enum ViewType {
}

// 来自: ../ERP_csharp/ERP.Db/Enums/ERPBase/WarehouseType.cs
export enum WarehouseType {
  Ordinary  = 0,
  Mould  = 1,
  Workmanship  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/TypeofWork.cs
export enum WorkingHourMode {
  无  = 0,
  单位工时  = 1,
  恒定时长  = 2,
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IAlias.cs
export interface IAlias {
  Alias: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IApprovalEntity.cs
export interface IApprovalEntity extends IStatus {
  ApprovalTime: string | null;
  ApprovalByUserid: number | null;
  IsApproval: boolean;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IBelong.cs
export interface IBelong {
  BelongToid: number;
  BelongToTableName: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IBringProcess.cs
export interface IBringProcess {
  IsUseBringProcess: boolean;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/ICanBeGenerated.cs
export interface ICanBeGenerated {
  CreateByDocumentid: number | null;
  CreateByDocumentType: string;
  CreateByDetailid: number | null;
  CreateByDetailType: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/ICanBeGeneratedV2.cs
export interface ICanBeGeneratedV2 {
  CreateByEntityid: number | null;
  CreateByEntityType: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IChangedInfo.cs
export interface IChangedInfo {
  CreateTime: string | null;
  CreateByUserid: number;
  UpdateTime: string | null;
  UpdateByUserid: number | null;
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckCaseDetail.cs
export interface ICheckCaseDetail {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IChild.cs
export interface IChild {
  ParentTypeid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IChildNode.cs
export interface IChildNode {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/ICode.cs
export interface ICode {
  Code: string;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IOT/IConnectForModbus.cs
export interface IConnectForModbus extends IConnectForNetwork, IConnectForSerialPort {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IOT/IConnectForNetwork.cs
export interface IConnectForNetwork {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IOT/IConnectForSerialPort.cs
export interface IConnectForSerialPort {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IDeleteTag.cs
export interface IDeleteTag {
  DeletedTag: boolean;
  DeleteTime: string | null;
  DeleteByUserid: number | null;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IDelivery.cs
export interface IDelivery {
  DeliveryTime: string | null;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IDetail.cs
export interface IDetail extends IUniqueEntity, IDeleteTag, IChild {
  Status: DocumentStatus;
  FinishTime: string | null;
  FinishByUserid: number | null;
  Note: string;
  ModifyMode: ModifyMode;
  GenerateById: number;
  ParentModifyId: number | null;
  ModifyTime: string;
  ModifyEmployeeid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IDetailRecord.cs
export interface IDetailRecord {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IDocument.cs
export interface IDocument extends IUniqueEntity, ICode, IChangedInfo, IApprovalEntity, ICanBeGenerated {
  DocumentTime: string;
  Status: any;
  FinishTime: string | null;
  FinishByUserid: number | null;
  Note: string;
  ModifyMode: ModifyMode;
  GenerateById: number;
  ParentModifyId: number | null;
  ModifyTime: string | null;
  ModifyEmployeeid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IDQty.cs
export interface IDQty {
  DQty: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IDUnit.cs
export interface IDUnit extends IOnlyHasMaterial, IDQty {
  DeputyUnitid: number;
  PushBackMode: PushBackMode;
  DeputyConversionRate: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IEnabled.cs
export interface IEnabled {
  EnabledTime: string | null;
  EnabledByUserid: number | null;
  IsEnabled: boolean;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IFile.cs
export interface IFile {
  CloudFileid: number;
  FileName: string;
  Suffix: string;
  FileDescription: string;
  Bytes: number[];
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IFinanceDocument.cs
export interface IFinanceDocument {
  Year: number;
  Stage: number;
  CheckIntervalStart: string;
  CheckIntervalEnd: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IFlowCardDetail.cs
export interface IFlowCardDetail {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IFlowCardDocument.cs
export interface IFlowCardDocument {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IFlowCardProcessCompletionDocument.cs
export interface IFlowCardProcessCompletionDocument {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IFlowCardProcessReceiveDocument.cs
export interface IFlowCardProcessReceiveDocument {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IHasClient.cs
export interface IHasClient {
  Clientid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IHasEmployee.cs
export interface IHasEmployee {
  Employeeid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IHasMaterial.cs
export interface IHasMaterial extends IOnlyHasMaterial {
  Warehouseid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IHasMoney.cs
export interface IHasMoney {
  UnitPrice: number;
  WeiShuiDanJia: number;
  HanShuiDanJia: number;
  WeiShuiJinE: number;
  JiaShuiJinE: number;
  TaxAmount: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IHasMoneyDocument.cs
export interface IHasMoneyDocument {
  TaxMode: string;
  TaxRate: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IHasSupplier.cs
export interface IHasSupplier {
  Supplierid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IHasTax.cs
export interface IHasTax {
  TaxRate: number;
  TaxMode: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IInnerKey.cs
export interface IInnerKey {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IInspectionDocument.cs
export interface IInspectionDocument {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IInspectionRequired.cs
export interface IInspectionRequired {
  IsUseInspectionRequired: boolean;
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Material.cs
export interface IMaterial extends ICode, IPause, IHasClient, IEnabled {
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Material.cs
export interface IMaterialCustomProperty {
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/INameRecord.cs
export interface INameRecord {
  Name: string;
  Note: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/INode.cs
export interface INode {
  Parentid: number | null;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IOnlyHasMaterial.cs
export interface IOnlyHasMaterial {
  Materialid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IOrderEntity.cs
export interface IOrderEntity extends IUniqueEntity {
  LocationIndex: number;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IOrderRecord.cs
export interface IOrderRecord {
  SortValue: number;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/IPanelSetting.cs
export interface IPanelSetting {
  ViewType: ViewType;
  DynamicParse: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IPartner.cs
export interface IPartner {
  IsPause: boolean;
  Code: string;
  Name: string;
  ShortName: string;
  ContractNum: string;
  MainLinkmanid: number;
  EmergencyLinkmanid: number;
  ProofDay: number | null;
  TransportMode: string;
  TaxMode: string;
  PaymentMode: string;
  TaxRate: number | null;
  NameOfVATCompany: string;
  VATTelephone: string;
  VATBankAddress: string;
  BankAccount: string;
  Address: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IPause.cs
export interface IPause {
  IsPause: boolean;
  PauseTime: string | null;
  PauseByUserid: number | null;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IPrintRecord.cs
export interface IPrintRecord {
  LastPrintUserid: number | null;
  LastPrintUserUid: number | null;
  LastPrintTime: string | null;
  PrintCount: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IProcessProgress.cs
export interface IProcessProgress {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IProportion.cs
export interface IProportion {
  OriginalRatio: number;
  CurrentRatio: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IPurchasePolicyDetailUnmanaged.cs
export interface IPurchasePolicyDetailUnmanaged {
  PurchasePrices: number;
  ProcessingPrice: number;
  ProcurementPeriod: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IQty.cs
export interface IQty {
  Qty: number;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/Resource/IResource.cs
export interface IResource {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IScanCode.cs
export interface IScanCode {
  CodeForScan: string;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/ISqlAttach.cs
export interface ISqlAttach {
  AttachTable: string;
  AttachShortName: string;
  AttachWhere: string;
  AttachJoin: string;
  AttachJoinSortValue: number;
  AttachJoinType: any;
  AttachSelect: string;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IStatus.cs
export interface IStatus {
  Status: DocumentStatus;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/ISupplier.cs
export interface ISupplier {
  TaxRegistrationAccount: string;
  VATRate: number;
  DepositBank: string;
  Note: string;
  MainLinkmanid: any;
  SupplierType: SupplierType;
  AccountingPeriod: number;
  WrittenOffNotReceived: number;
  WrittenOffNotReceivedBeforeTheCreditPeriod: number;
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Interfaces/ISystemSetting.cs
export interface ISystemSetting {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IUiAgent.cs
export interface IUiAgent {
  ControlType: ControlType;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IUniqueEntity.cs
export interface IUniqueEntity {
  Uid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IUnit.cs
export interface IUnit extends IOnlyHasMaterial, IQty {
  Unitid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IUniversalModifyDetail.cs
export interface IUniversalModifyDetail {
  Targetid: number;
  ChangeTimeType: ChangeTimeType;
  PairKey: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IUniversalModifyDocument.cs
export interface IUniversalModifyDocument {
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IUseBom.cs
export interface IUseBom extends IProportion {
  UseBomid: number;
}

// 来自: ../ERP_csharp/ERP.Db/Interfaces/IUserInterface.cs
export interface IUserInterface {
  Width: number;
  MinWidth: number;
  MaxWidth: number;
  BeforeName: string;
  DisplayName: string;
  ViewFieldBehavior: ViewFieldBehavior;
  Parameters: string;
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/EmployeeFile.cs
export class EmployeeFile extends ErpRecord implements IFile, IUniqueEntity {
  Employeelid!: number;
  EnumKey!: EmployeeFileType;
  CloudFileid!: number;
  FileName!: string;
  Suffix!: string;
  FileDescription!: string;
  Bytes!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Employeelid === undefined || this.Employeelid === null) {
      this.Employeelid = 0;
    }
    if (this.EnumKey === undefined || this.EnumKey === null) {
      this.EnumKey = EmployeeFileType.职员照片 ;
    }
    if (this.CloudFileid === undefined || this.CloudFileid === null) {
      this.CloudFileid = 0;
    }
    if (this.FileName === undefined || this.FileName === null) {
      this.FileName = '';
    }
    if (this.Suffix === undefined || this.Suffix === null) {
      this.Suffix = '';
    }
    if (this.FileDescription === undefined || this.FileDescription === null) {
      this.FileDescription = '';
    }
    if (this.Bytes === undefined || this.Bytes === null) {
      this.Bytes = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/FileRecordForNcr.cs
export class FileRecordForNcr extends ErpRecord implements IFile, IUniqueEntity {
  Billid!: number;
  CloudFileid!: number;
  FileName!: string;
  Suffix!: string;
  FileDescription!: string;
  Bytes!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Billid === undefined || this.Billid === null) {
      this.Billid = 0;
    }
    if (this.CloudFileid === undefined || this.CloudFileid === null) {
      this.CloudFileid = 0;
    }
    if (this.FileName === undefined || this.FileName === null) {
      this.FileName = '';
    }
    if (this.Suffix === undefined || this.Suffix === null) {
      this.Suffix = '';
    }
    if (this.FileDescription === undefined || this.FileDescription === null) {
      this.FileDescription = '';
    }
    if (this.Bytes === undefined || this.Bytes === null) {
      this.Bytes = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/MESEntities/IOTEquipmentStatus.cs
export class IOTEquipmentStatus extends ErpRecord {
  EquipmentUid!: number;
  OnlineState!: any;
  StateNote!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EquipmentUid === undefined || this.EquipmentUid === null) {
      this.EquipmentUid = 0;
    }
    if (this.StateNote === undefined || this.StateNote === null) {
      this.StateNote = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemRangeRoleDetail.cs
export class JoinInfoList {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/JwtBlacklist.cs
export class JwtBlacklist extends ErpRecord {
  Jti!: string;
  TokenType!: string;
  ExpiresAt!: string;
  CreatedAt!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Jti === undefined || this.Jti === null) {
      this.Jti = '';
    }
    if (this.TokenType === undefined || this.TokenType === null) {
      this.TokenType = '';
    }
    if (this.ExpiresAt === undefined || this.ExpiresAt === null) {
      this.ExpiresAt = '';
    }
    if (this.CreatedAt === undefined || this.CreatedAt === null) {
      this.CreatedAt = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/Basic/NewRecord.cs
export class NewRecord extends ErpRecord implements IOrderRecord {
  SortValue!: number;
  IsDeleted!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.SortValue === undefined || this.SortValue === null) {
      this.SortValue = 0;
    }
    if (this.IsDeleted === undefined || this.IsDeleted === null) {
      this.IsDeleted = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/MESEntities/IOTEquipmentAttachProperties.cs
export class IOTEquipmentAttachProperties extends NewRecord {
  EquipmentUid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EquipmentUid === undefined || this.EquipmentUid === null) {
      this.EquipmentUid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/MESEntities/IOTMESEquipmentBind.cs
export class IOTMESEquipmentBind extends NewRecord {
  EquipmentUid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EquipmentUid === undefined || this.EquipmentUid === null) {
      this.EquipmentUid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/Basic/NameRecord.cs
export class NameRecord extends NewRecord {
  Name!: string;
  Note!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/MESEntities/IOTEquipment.cs
export class IOTEquipment extends NameRecord {
  Code!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProcessAssemblyFlowDetail.cs
export class ProcessAssemblyFlowDetailInfo {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProcessAssemblyFlowDocument.cs
export class ProcessAssemblyFlowDocumentInfo {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProduceFlowDetail.cs
export class ProduceFlowDetailInfo {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProduceFlowDocument.cs
export class ProduceFlowDocumentInfo {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/BusinessEntities/Core/QtyRecord.cs
export class QtyRecord extends ErpRecord {
  BillTypeUid!: number;
  BillId!: number;
  DetailId!: number;
  BillDate!: string;
  BillCode!: string;
  BillDepartment!: number;
  Materialid!: number;
  MaterialCode!: string;
  MaterialName!: string;
  MaterialSpecType!: string;
  MaterialUnitId!: number;
  Qty!: number;
  InnerKey!: string;
  Targetid!: number;
  Employeeid!: number;
  Id1!: number;
  Id2!: number;
  Id3!: number;
  Id4!: number;
  Id5!: number;
  Uid1!: number;
  Uid2!: number;
  Uid3!: number;
  Uid4!: number;
  Uid5!: number;
  Note1!: string;
  Note2!: string;
  Note3!: string;
  Note4!: string;
  Note5!: string;
  Qty1!: number;
  Qty2!: number;
  Qty3!: number;
  Qty4!: number;
  Qty5!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BillTypeUid === undefined || this.BillTypeUid === null) {
      this.BillTypeUid = 0;
    }
    if (this.BillId === undefined || this.BillId === null) {
      this.BillId = 0;
    }
    if (this.DetailId === undefined || this.DetailId === null) {
      this.DetailId = 0;
    }
    if (this.BillDate === undefined || this.BillDate === null) {
      this.BillDate = '';
    }
    if (this.BillCode === undefined || this.BillCode === null) {
      this.BillCode = '';
    }
    if (this.BillDepartment === undefined || this.BillDepartment === null) {
      this.BillDepartment = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.MaterialCode === undefined || this.MaterialCode === null) {
      this.MaterialCode = '';
    }
    if (this.MaterialName === undefined || this.MaterialName === null) {
      this.MaterialName = '';
    }
    if (this.MaterialSpecType === undefined || this.MaterialSpecType === null) {
      this.MaterialSpecType = '';
    }
    if (this.MaterialUnitId === undefined || this.MaterialUnitId === null) {
      this.MaterialUnitId = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Targetid === undefined || this.Targetid === null) {
      this.Targetid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Id1 === undefined || this.Id1 === null) {
      this.Id1 = 0;
    }
    if (this.Id2 === undefined || this.Id2 === null) {
      this.Id2 = 0;
    }
    if (this.Id3 === undefined || this.Id3 === null) {
      this.Id3 = 0;
    }
    if (this.Id4 === undefined || this.Id4 === null) {
      this.Id4 = 0;
    }
    if (this.Id5 === undefined || this.Id5 === null) {
      this.Id5 = 0;
    }
    if (this.Uid1 === undefined || this.Uid1 === null) {
      this.Uid1 = 0;
    }
    if (this.Uid2 === undefined || this.Uid2 === null) {
      this.Uid2 = 0;
    }
    if (this.Uid3 === undefined || this.Uid3 === null) {
      this.Uid3 = 0;
    }
    if (this.Uid4 === undefined || this.Uid4 === null) {
      this.Uid4 = 0;
    }
    if (this.Uid5 === undefined || this.Uid5 === null) {
      this.Uid5 = 0;
    }
    if (this.Note1 === undefined || this.Note1 === null) {
      this.Note1 = '';
    }
    if (this.Note2 === undefined || this.Note2 === null) {
      this.Note2 = '';
    }
    if (this.Note3 === undefined || this.Note3 === null) {
      this.Note3 = '';
    }
    if (this.Note4 === undefined || this.Note4 === null) {
      this.Note4 = '';
    }
    if (this.Note5 === undefined || this.Note5 === null) {
      this.Note5 = '';
    }
    if (this.Qty1 === undefined || this.Qty1 === null) {
      this.Qty1 = 0;
    }
    if (this.Qty2 === undefined || this.Qty2 === null) {
      this.Qty2 = 0;
    }
    if (this.Qty3 === undefined || this.Qty3 === null) {
      this.Qty3 = 0;
    }
    if (this.Qty4 === undefined || this.Qty4 === null) {
      this.Qty4 = 0;
    }
    if (this.Qty5 === undefined || this.Qty5 === null) {
      this.Qty5 = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/BusinessEntities/Qty/BuyPreQty.cs
export class BuyPreQty extends QtyRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/BusinessEntities/Qty/OrderedQty.cs
export class OrderedQty extends QtyRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/BusinessEntities/Qty/PreProductionQty.cs
export class PreProductionQty extends QtyRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/BusinessEntities/Qty/ProductionQty.cs
export class ProductionQty extends QtyRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/ResourceEntities/ResourceImage.cs
export class ResourceImage extends NameRecord implements IResource {
  Width!: number;
  Height!: number;
  BitDepth!: number;
  Content!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Width === undefined || this.Width === null) {
      this.Width = 0;
    }
    if (this.Height === undefined || this.Height === null) {
      this.Height = 0;
    }
    if (this.BitDepth === undefined || this.BitDepth === null) {
      this.BitDepth = 0;
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/ResourceEntities/ResourceSvg.cs
export class ResourceSvg extends NameRecord implements IResource {
  Content!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysCoreKeyValuePairs.cs
export class SysCoreKeyValuePairs implements IUniqueEntity {
  id!: number;
  Uid!: number;
  Key!: string;
  Value!: string;
  TypeCode!: any;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (this.id === undefined || this.id === null) {
      this.id = 0;
    }
    if (this.Uid === undefined || this.Uid === null) {
      this.Uid = 0;
    }
    if (this.Key === undefined || this.Key === null) {
      this.Key = '';
    }
    if (this.Value === undefined || this.Value === null) {
      this.Value = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemAlarmSetting.cs
export class SystemAlarmSetting extends NameRecord {
  AlarmDescription!: string;
  TypeUid!: number;
  TableName!: string;
  DataCondition!: string;
  DataJoin!: string;
  DataOrder!: string;
  DataDescription!: string;
  FrameViewTypeName!: string;
  NotifyUserCondition!: string;
  NotifyUserJoin!: string;
  NotifyUserIds!: string;
  NotifyUserNames!: string;
  TimeSpanUnit!: TimeSpanUnit;
  TimeSpanValue!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.AlarmDescription === undefined || this.AlarmDescription === null) {
      this.AlarmDescription = '';
    }
    if (this.TypeUid === undefined || this.TypeUid === null) {
      this.TypeUid = 0;
    }
    if (this.TableName === undefined || this.TableName === null) {
      this.TableName = '';
    }
    if (this.DataCondition === undefined || this.DataCondition === null) {
      this.DataCondition = '';
    }
    if (this.DataJoin === undefined || this.DataJoin === null) {
      this.DataJoin = '';
    }
    if (this.DataOrder === undefined || this.DataOrder === null) {
      this.DataOrder = '';
    }
    if (this.DataDescription === undefined || this.DataDescription === null) {
      this.DataDescription = '';
    }
    if (this.FrameViewTypeName === undefined || this.FrameViewTypeName === null) {
      this.FrameViewTypeName = '';
    }
    if (this.NotifyUserCondition === undefined || this.NotifyUserCondition === null) {
      this.NotifyUserCondition = '';
    }
    if (this.NotifyUserJoin === undefined || this.NotifyUserJoin === null) {
      this.NotifyUserJoin = '';
    }
    if (this.NotifyUserIds === undefined || this.NotifyUserIds === null) {
      this.NotifyUserIds = '';
    }
    if (this.NotifyUserNames === undefined || this.NotifyUserNames === null) {
      this.NotifyUserNames = '';
    }
    if (this.TimeSpanUnit === undefined || this.TimeSpanUnit === null) {
      this.TimeSpanUnit = TimeSpanUnit.秒 ;
    }
    if (this.TimeSpanValue === undefined || this.TimeSpanValue === null) {
      this.TimeSpanValue = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemBillInfo.cs
export class SystemBillInfo extends NameRecord {
  BillTypeUid!: number;
  DetailTypeUid!: number;
  BillTriggerMode!: BillTriggerMode;
  QtyGenerateMode!: QtyGenerateMode;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BillTypeUid === undefined || this.BillTypeUid === null) {
      this.BillTypeUid = 0;
    }
    if (this.DetailTypeUid === undefined || this.DetailTypeUid === null) {
      this.DetailTypeUid = 0;
    }
    if (this.BillTriggerMode === undefined || this.BillTriggerMode === null) {
      this.BillTriggerMode = BillTriggerMode.None ;
    }
    if (this.QtyGenerateMode === undefined || this.QtyGenerateMode === null) {
      this.QtyGenerateMode = QtyGenerateMode.产生受订量 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemBillRelation.cs
export class SystemBillRelation extends ErpRecord {
  BillTypeUid!: number;
  BillTableName!: string;
  RefBillTypeUid!: number;
  RefBillTableName!: string;
  RelationMode!: RelationMode;
  TestCompleted!: TestCompleted;
  BaseField!: string;
  RefTestField!: string;
  QtyControlMode!: QuantityControlMode;
  RelationGroup!: RelationGroup;
  RefField!: string;
  RefSumField!: string;
  RelationGroup2!: RelationGroup;
  RefField2!: string;
  RefSumField2!: string;
  FilterCondition!: string;
  JoinInfo!: string;
  Note!: string;
  RefDateField!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BillTypeUid === undefined || this.BillTypeUid === null) {
      this.BillTypeUid = 0;
    }
    if (this.BillTableName === undefined || this.BillTableName === null) {
      this.BillTableName = '';
    }
    if (this.RefBillTypeUid === undefined || this.RefBillTypeUid === null) {
      this.RefBillTypeUid = 0;
    }
    if (this.RefBillTableName === undefined || this.RefBillTableName === null) {
      this.RefBillTableName = '';
    }
    if (this.RelationMode === undefined || this.RelationMode === null) {
      this.RelationMode = RelationMode.正向 ;
    }
    if (this.TestCompleted === undefined || this.TestCompleted === null) {
      this.TestCompleted = TestCompleted.完成上游受订量 ;
    }
    if (this.BaseField === undefined || this.BaseField === null) {
      this.BaseField = '';
    }
    if (this.RefTestField === undefined || this.RefTestField === null) {
      this.RefTestField = '';
    }
    if (this.QtyControlMode === undefined || this.QtyControlMode === null) {
      this.QtyControlMode = QuantityControlMode.不控制 ;
    }
    if (this.RelationGroup === undefined || this.RelationGroup === null) {
      this.RelationGroup = RelationGroup.参与选择 ;
    }
    if (this.RefField === undefined || this.RefField === null) {
      this.RefField = '';
    }
    if (this.RefSumField === undefined || this.RefSumField === null) {
      this.RefSumField = '';
    }
    if (this.RelationGroup2 === undefined || this.RelationGroup2 === null) {
      this.RelationGroup2 = RelationGroup.参与选择 ;
    }
    if (this.RefField2 === undefined || this.RefField2 === null) {
      this.RefField2 = '';
    }
    if (this.RefSumField2 === undefined || this.RefSumField2 === null) {
      this.RefSumField2 = '';
    }
    if (this.FilterCondition === undefined || this.FilterCondition === null) {
      this.FilterCondition = '';
    }
    if (this.JoinInfo === undefined || this.JoinInfo === null) {
      this.JoinInfo = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.RefDateField === undefined || this.RefDateField === null) {
      this.RefDateField = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/PrefabLogicEntities/SystemCascadingUpdate.cs
export class SystemCascadingUpdate extends NameRecord {
  PageUid!: number;
  SourceControlName!: string;
  TargetControlName!: string;
  SourceCascadingField!: string;
  TargetCascadingField!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.PageUid === undefined || this.PageUid === null) {
      this.PageUid = 0;
    }
    if (this.SourceControlName === undefined || this.SourceControlName === null) {
      this.SourceControlName = '';
    }
    if (this.TargetControlName === undefined || this.TargetControlName === null) {
      this.TargetControlName = '';
    }
    if (this.SourceCascadingField === undefined || this.SourceCascadingField === null) {
      this.SourceCascadingField = '';
    }
    if (this.TargetCascadingField === undefined || this.TargetCascadingField === null) {
      this.TargetCascadingField = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/PrefabLogicEntities/SystemCascadingUpdateField.cs
export class SystemCascadingUpdateField extends NewRecord {
  CascadingUpdateUid!: number;
  SourceRelatedField!: string;
  TargetRelatedField!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CascadingUpdateUid === undefined || this.CascadingUpdateUid === null) {
      this.CascadingUpdateUid = 0;
    }
    if (this.SourceRelatedField === undefined || this.SourceRelatedField === null) {
      this.SourceRelatedField = '';
    }
    if (this.TargetRelatedField === undefined || this.TargetRelatedField === null) {
      this.TargetRelatedField = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemControl.cs
export class SystemControl extends NameRecord implements ISqlAttach {
  ViewUid!: number;
  ParentControlUid!: number | null;
  ControlMode!: ControlMode;
  ControlType!: ControlType;
  SettingUid!: number | null;
  BindMenuUid!: number | null;
  Header!: string;
  FieldName!: string;
  HorizontalAlignment!: Alignment;
  VerticalAlignment!: Alignment;
  Left!: number | null;
  Top!: number | null;
  Right!: number | null;
  Bottom!: number | null;
  Width!: number | null;
  Height!: number | null;
  EffectGroup!: EffectGroup;
  QuickBind!: string;
  SharedWriteValues!: string;
  AttachTable!: string;
  AttachShortName!: string;
  AttachWhere!: string;
  AttachJoin!: string;
  AttachJoinSortValue!: number;
  AttachJoinType!: any;
  AttachSelect!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ViewUid === undefined || this.ViewUid === null) {
      this.ViewUid = 0;
    }
    if (this.Header === undefined || this.Header === null) {
      this.Header = '';
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
    if (this.EffectGroup === undefined || this.EffectGroup === null) {
      this.EffectGroup = EffectGroup.None ;
    }
    if (this.QuickBind === undefined || this.QuickBind === null) {
      this.QuickBind = '';
    }
    if (this.SharedWriteValues === undefined || this.SharedWriteValues === null) {
      this.SharedWriteValues = '';
    }
    if (this.AttachTable === undefined || this.AttachTable === null) {
      this.AttachTable = '';
    }
    if (this.AttachShortName === undefined || this.AttachShortName === null) {
      this.AttachShortName = '';
    }
    if (this.AttachWhere === undefined || this.AttachWhere === null) {
      this.AttachWhere = '';
    }
    if (this.AttachJoin === undefined || this.AttachJoin === null) {
      this.AttachJoin = '';
    }
    if (this.AttachJoinSortValue === undefined || this.AttachJoinSortValue === null) {
      this.AttachJoinSortValue = 0;
    }
    if (this.AttachSelect === undefined || this.AttachSelect === null) {
      this.AttachSelect = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemControlDataGridAttach.cs
export class SystemControlDataGridAttach extends NewRecord {
  ControlUid!: number;
  DataGridFeature!: DataGridFeature;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ControlUid === undefined || this.ControlUid === null) {
      this.ControlUid = 0;
    }
    if (this.DataGridFeature === undefined || this.DataGridFeature === null) {
      this.DataGridFeature = DataGridFeature.None ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemControlFieldAttach.cs
export class SystemControlFieldAttach extends NewRecord {
  ControlUid!: number;
  FieldName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ControlUid === undefined || this.ControlUid === null) {
      this.ControlUid = 0;
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemControlSettingInGrid.cs
export class SystemControlSettingInGrid extends NewRecord {
  ControlUid!: number;
  Row!: number;
  Column!: number;
  RowSpan!: number | null;
  ColumnSpan!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ControlUid === undefined || this.ControlUid === null) {
      this.ControlUid = 0;
    }
    if (this.Row === undefined || this.Row === null) {
      this.Row = 0;
    }
    if (this.Column === undefined || this.Column === null) {
      this.Column = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemDataGridConditionalFormatAttach.cs
export class SystemDataGridConditionalFormatAttach extends NewRecord {
  ControlUid!: number;
  FieldName!: string;
  ValueRule!: ConditionRule;
  Value!: string;
  ApplyToRow!: boolean;
  FormatBackground!: string;
  FormatForeground!: string;
  FormatFontSize!: number;
  Expression!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ControlUid === undefined || this.ControlUid === null) {
      this.ControlUid = 0;
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
    if (this.ValueRule === undefined || this.ValueRule === null) {
      this.ValueRule = ConditionRule.None;
    }
    if (this.Value === undefined || this.Value === null) {
      this.Value = '';
    }
    if (this.ApplyToRow === undefined || this.ApplyToRow === null) {
      this.ApplyToRow = false;
    }
    if (this.FormatBackground === undefined || this.FormatBackground === null) {
      this.FormatBackground = '';
    }
    if (this.FormatForeground === undefined || this.FormatForeground === null) {
      this.FormatForeground = '';
    }
    if (this.FormatFontSize === undefined || this.FormatFontSize === null) {
      this.FormatFontSize = 0;
    }
    if (this.Expression === undefined || this.Expression === null) {
      this.Expression = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemDataView.cs
export class SystemDataView extends NameRecord {
  TableName!: string;
  TableShortName!: string;
  Where!: string;
  Select!: string;
  OrderBy!: string;
  GroupBy!: string;
  Having!: string;
  DataViewMode!: DataViewMode;
  DataViewType!: DataViewType;
  SystemProcedureUid!: number;
  ParameterGroup!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TableName === undefined || this.TableName === null) {
      this.TableName = '';
    }
    if (this.TableShortName === undefined || this.TableShortName === null) {
      this.TableShortName = '';
    }
    if (this.Where === undefined || this.Where === null) {
      this.Where = '';
    }
    if (this.Select === undefined || this.Select === null) {
      this.Select = '';
    }
    if (this.OrderBy === undefined || this.OrderBy === null) {
      this.OrderBy = '';
    }
    if (this.GroupBy === undefined || this.GroupBy === null) {
      this.GroupBy = '';
    }
    if (this.Having === undefined || this.Having === null) {
      this.Having = '';
    }
    if (this.DataViewType === undefined || this.DataViewType === null) {
      this.DataViewType = DataViewType.None;
    }
    if (this.SystemProcedureUid === undefined || this.SystemProcedureUid === null) {
      this.SystemProcedureUid = 0;
    }
    if (this.ParameterGroup === undefined || this.ParameterGroup === null) {
      this.ParameterGroup = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemDataViewField.cs
export class SystemDataViewField extends NameRecord implements ISqlAttach {
  DataViewUid!: number;
  ControlType!: ControlType;
  DataFieldMode!: DataFieldMode;
  SettingUid!: number;
  Header!: string;
  GroupHeader!: string;
  FieldName!: string;
  FieldDisplayMember!: string;
  AttachTable!: string;
  AttachShortName!: string;
  AttachWhere!: string;
  AttachJoin!: string;
  AttachJoinSortValue!: number;
  AttachJoinType!: any;
  AttachSelect!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DataViewUid === undefined || this.DataViewUid === null) {
      this.DataViewUid = 0;
    }
    if (this.DataFieldMode === undefined || this.DataFieldMode === null) {
      this.DataFieldMode = DataFieldMode.None ;
    }
    if (this.SettingUid === undefined || this.SettingUid === null) {
      this.SettingUid = 0;
    }
    if (this.Header === undefined || this.Header === null) {
      this.Header = '';
    }
    if (this.GroupHeader === undefined || this.GroupHeader === null) {
      this.GroupHeader = '';
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
    if (this.FieldDisplayMember === undefined || this.FieldDisplayMember === null) {
      this.FieldDisplayMember = '';
    }
    if (this.AttachTable === undefined || this.AttachTable === null) {
      this.AttachTable = '';
    }
    if (this.AttachShortName === undefined || this.AttachShortName === null) {
      this.AttachShortName = '';
    }
    if (this.AttachWhere === undefined || this.AttachWhere === null) {
      this.AttachWhere = '';
    }
    if (this.AttachJoin === undefined || this.AttachJoin === null) {
      this.AttachJoin = '';
    }
    if (this.AttachJoinSortValue === undefined || this.AttachJoinSortValue === null) {
      this.AttachJoinSortValue = 0;
    }
    if (this.AttachSelect === undefined || this.AttachSelect === null) {
      this.AttachSelect = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemDataWriteRule.cs
export class SystemDataWriteRule extends NewRecord {
  SourceTableName!: string;
  TargetTableName!: string;
  SourceFieldName!: string;
  TargetFieldName!: string;
  DataWriteTiming!: DataWriteTiming;
  DataWriteMode!: DataWriteMode;
  PresetFunctions!: TestCompleted;
  Condition!: string;
  EffectGroup!: EffectGroup;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.SourceTableName === undefined || this.SourceTableName === null) {
      this.SourceTableName = '';
    }
    if (this.TargetTableName === undefined || this.TargetTableName === null) {
      this.TargetTableName = '';
    }
    if (this.SourceFieldName === undefined || this.SourceFieldName === null) {
      this.SourceFieldName = '';
    }
    if (this.TargetFieldName === undefined || this.TargetFieldName === null) {
      this.TargetFieldName = '';
    }
    if (this.DataWriteTiming === undefined || this.DataWriteTiming === null) {
      this.DataWriteTiming = DataWriteTiming.None ;
    }
    if (this.DataWriteMode === undefined || this.DataWriteMode === null) {
      this.DataWriteMode = DataWriteMode.None ;
    }
    if (this.PresetFunctions === undefined || this.PresetFunctions === null) {
      this.PresetFunctions = TestCompleted.完成上游受订量 ;
    }
    if (this.Condition === undefined || this.Condition === null) {
      this.Condition = '';
    }
    if (this.EffectGroup === undefined || this.EffectGroup === null) {
      this.EffectGroup = EffectGroup.None ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemErrorTip.cs
export class SystemErrorTip extends ErpRecord {
  Code!: number;
  Format!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = 0;
    }
    if (this.Format === undefined || this.Format === null) {
      this.Format = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemField.cs
export class SystemField extends NewRecord {
  TypeUid!: number;
  TableName!: string;
  FieldName!: string;
  Name!: string;
  RuleValue!: number;
  CSharpType!: CSharpType;
  SqlServerType!: string;
  FieldMode!: FieldMode;
  OtherTableName!: string;
  OtherField!: string;
  AutoFieldRuleGroup!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TypeUid === undefined || this.TypeUid === null) {
      this.TypeUid = 0;
    }
    if (this.TableName === undefined || this.TableName === null) {
      this.TableName = '';
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.RuleValue === undefined || this.RuleValue === null) {
      this.RuleValue = 0;
    }
    if (this.CSharpType === undefined || this.CSharpType === null) {
      this.CSharpType = CSharpType.None ;
    }
    if (this.SqlServerType === undefined || this.SqlServerType === null) {
      this.SqlServerType = '';
    }
    if (this.FieldMode === undefined || this.FieldMode === null) {
      this.FieldMode = FieldMode.不能为空 ;
    }
    if (this.OtherTableName === undefined || this.OtherTableName === null) {
      this.OtherTableName = '';
    }
    if (this.OtherField === undefined || this.OtherField === null) {
      this.OtherField = '';
    }
    if (this.AutoFieldRuleGroup === undefined || this.AutoFieldRuleGroup === null) {
      this.AutoFieldRuleGroup = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/PrefabLogicEntities/SystemFieldMapping.cs
export class SystemFieldMapping extends NameRecord {
  PageUid!: number;
  FieldMappingMode!: FieldMappingMode;
  SourceControlName!: string;
  TargetControlName!: string;
  SourceFieldName!: string;
  TargetFieldName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.PageUid === undefined || this.PageUid === null) {
      this.PageUid = 0;
    }
    if (this.FieldMappingMode === undefined || this.FieldMappingMode === null) {
      this.FieldMappingMode = FieldMappingMode.None;
    }
    if (this.SourceControlName === undefined || this.SourceControlName === null) {
      this.SourceControlName = '';
    }
    if (this.TargetControlName === undefined || this.TargetControlName === null) {
      this.TargetControlName = '';
    }
    if (this.SourceFieldName === undefined || this.SourceFieldName === null) {
      this.SourceFieldName = '';
    }
    if (this.TargetFieldName === undefined || this.TargetFieldName === null) {
      this.TargetFieldName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/PrefabLogicEntities/SystemFieldMappingField.cs
export class SystemFieldMappingField extends NewRecord {
  FieldMappingUid!: number;
  SourceFieldName!: string;
  TargetFieldName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.FieldMappingUid === undefined || this.FieldMappingUid === null) {
      this.FieldMappingUid = 0;
    }
    if (this.SourceFieldName === undefined || this.SourceFieldName === null) {
      this.SourceFieldName = '';
    }
    if (this.TargetFieldName === undefined || this.TargetFieldName === null) {
      this.TargetFieldName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemFieldRole.cs
export class SystemFieldRole extends NameRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemFieldRoleDetail.cs
export class SystemFieldRoleDetail extends NewRecord {
  FieldRoleUid!: number;
  TableUid!: number;
  TableName!: string;
  PermissionsGroup!: number;
  DenyView!: number;
  DenyModify!: number;
  DenyPrint!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.FieldRoleUid === undefined || this.FieldRoleUid === null) {
      this.FieldRoleUid = 0;
    }
    if (this.TableUid === undefined || this.TableUid === null) {
      this.TableUid = 0;
    }
    if (this.TableName === undefined || this.TableName === null) {
      this.TableName = '';
    }
    if (this.PermissionsGroup === undefined || this.PermissionsGroup === null) {
      this.PermissionsGroup = 0;
    }
    if (this.DenyView === undefined || this.DenyView === null) {
      this.DenyView = 0;
    }
    if (this.DenyModify === undefined || this.DenyModify === null) {
      this.DenyModify = 0;
    }
    if (this.DenyPrint === undefined || this.DenyPrint === null) {
      this.DenyPrint = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemMenu.cs
export class SystemMenu extends NameRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemMenuItem.cs
export class SystemMenuItem extends NameRecord {
  ParentUid!: number | null;
  IconName!: string;
  Content!: string;
  CommandKey!: string;
  CommandParameter!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IconName === undefined || this.IconName === null) {
      this.IconName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.CommandKey === undefined || this.CommandKey === null) {
      this.CommandKey = '';
    }
    if (this.CommandParameter === undefined || this.CommandParameter === null) {
      this.CommandParameter = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemModule.cs
export class SystemModule extends NewRecord {
  Name!: string;
  IconName!: string;
  BindPageUid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IconName === undefined || this.IconName === null) {
      this.IconName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemModuleItem.cs
export class SystemModuleItem extends NameRecord {
  BelongToModuleUid!: number | null;
  ParentUid!: number | null;
  DisplayName!: string;
  IconName!: string;
  BindPageUid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DisplayName === undefined || this.DisplayName === null) {
      this.DisplayName = '';
    }
    if (this.IconName === undefined || this.IconName === null) {
      this.IconName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemNotifyConfig.cs
export class SystemNotifyConfig extends NameRecord {
  TypeUid!: number;
  TableName!: string;
  NotifyEvent!: NotifyEvent;
  InvokeCondition!: string;
  InvokeJoin!: string;
  NotifyMode!: NotifyMode;
  NotifyUserCondition!: string;
  NotifyUserJoin!: string;
  MessageTemplate!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TypeUid === undefined || this.TypeUid === null) {
      this.TypeUid = 0;
    }
    if (this.TableName === undefined || this.TableName === null) {
      this.TableName = '';
    }
    if (this.NotifyEvent === undefined || this.NotifyEvent === null) {
      this.NotifyEvent = NotifyEvent.Save ;
    }
    if (this.InvokeCondition === undefined || this.InvokeCondition === null) {
      this.InvokeCondition = '';
    }
    if (this.InvokeJoin === undefined || this.InvokeJoin === null) {
      this.InvokeJoin = '';
    }
    if (this.NotifyMode === undefined || this.NotifyMode === null) {
      this.NotifyMode = NotifyMode.Email ;
    }
    if (this.NotifyUserCondition === undefined || this.NotifyUserCondition === null) {
      this.NotifyUserCondition = '';
    }
    if (this.NotifyUserJoin === undefined || this.NotifyUserJoin === null) {
      this.NotifyUserJoin = '';
    }
    if (this.MessageTemplate === undefined || this.MessageTemplate === null) {
      this.MessageTemplate = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemOfflineMessage.cs
export class SystemOfflineMessage extends NewRecord {
  Userid!: number;
  Message!: string;
  IsRead!: boolean;
  ReceiveTime!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Userid === undefined || this.Userid === null) {
      this.Userid = 0;
    }
    if (this.Message === undefined || this.Message === null) {
      this.Message = '';
    }
    if (this.IsRead === undefined || this.IsRead === null) {
      this.IsRead = false;
    }
    if (this.ReceiveTime === undefined || this.ReceiveTime === null) {
      this.ReceiveTime = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemPage.cs
export class SystemPage extends NewRecord {
  Name!: string;
  Header!: string;
  BusinessCoreKey!: string;
  PageMode!: PageMode;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Header === undefined || this.Header === null) {
      this.Header = '';
    }
    if (this.BusinessCoreKey === undefined || this.BusinessCoreKey === null) {
      this.BusinessCoreKey = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemPageViewLink.cs
export class SystemPageViewLink extends NewRecord {
  PageUid!: number;
  ViewUid!: number;
  Position!: Position;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.PageUid === undefined || this.PageUid === null) {
      this.PageUid = 0;
    }
    if (this.ViewUid === undefined || this.ViewUid === null) {
      this.ViewUid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemProcedure.cs
export class SystemProcedure extends NameRecord {
  Alias!: string;
  CodeMirrorImage!: string;
  CodeMirrorImageHistory1!: string;
  CodeMirrorImageHistory2!: string;
  CodeMirrorImageHistory3!: string;
  ChangedCount!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Alias === undefined || this.Alias === null) {
      this.Alias = '';
    }
    if (this.CodeMirrorImage === undefined || this.CodeMirrorImage === null) {
      this.CodeMirrorImage = '';
    }
    if (this.CodeMirrorImageHistory1 === undefined || this.CodeMirrorImageHistory1 === null) {
      this.CodeMirrorImageHistory1 = '';
    }
    if (this.CodeMirrorImageHistory2 === undefined || this.CodeMirrorImageHistory2 === null) {
      this.CodeMirrorImageHistory2 = '';
    }
    if (this.CodeMirrorImageHistory3 === undefined || this.CodeMirrorImageHistory3 === null) {
      this.CodeMirrorImageHistory3 = '';
    }
    if (this.ChangedCount === undefined || this.ChangedCount === null) {
      this.ChangedCount = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemProcedureParameter.cs
export class SystemProcedureParameter extends NameRecord implements IAlias {
  ProcedureUid!: number;
  Alias!: string;
  ParameterType!: string;
  ParameterLength!: number;
  ParameterPrecision!: number;
  ParameterDirection!: any;
  DefaultValue!: string;
  BindDynamicParameterName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcedureUid === undefined || this.ProcedureUid === null) {
      this.ProcedureUid = 0;
    }
    if (this.Alias === undefined || this.Alias === null) {
      this.Alias = '';
    }
    if (this.ParameterType === undefined || this.ParameterType === null) {
      this.ParameterType = '';
    }
    if (this.ParameterLength === undefined || this.ParameterLength === null) {
      this.ParameterLength = 0;
    }
    if (this.ParameterPrecision === undefined || this.ParameterPrecision === null) {
      this.ParameterPrecision = 0;
    }
    if (this.DefaultValue === undefined || this.DefaultValue === null) {
      this.DefaultValue = '';
    }
    if (this.BindDynamicParameterName === undefined || this.BindDynamicParameterName === null) {
      this.BindDynamicParameterName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemProcedureScenario.cs
export class SystemProcedureScenario extends NameRecord {
  ProcedureName!: string;
  ProcedureUid!: number;
  ParameterName!: string;
  ParameterDefault!: string;
  DynamicParameterName!: string;
  DynamicParameterValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcedureName === undefined || this.ProcedureName === null) {
      this.ProcedureName = '';
    }
    if (this.ProcedureUid === undefined || this.ProcedureUid === null) {
      this.ProcedureUid = 0;
    }
    if (this.ParameterName === undefined || this.ParameterName === null) {
      this.ParameterName = '';
    }
    if (this.ParameterDefault === undefined || this.ParameterDefault === null) {
      this.ParameterDefault = '';
    }
    if (this.DynamicParameterName === undefined || this.DynamicParameterName === null) {
      this.DynamicParameterName = '';
    }
    if (this.DynamicParameterValue === undefined || this.DynamicParameterValue === null) {
      this.DynamicParameterValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemRangeRole.cs
export class SystemRangeRole extends NameRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemRangeRoleDetail.cs
export class SystemRangeRoleDetail extends NewRecord {
  RangeRoleUid!: number;
  TypeUid!: number;
  TableName!: string;
  PermissionEffectEffectMode!: RangeRolePermissionEffectMode;
  Permissions!: Permissions;
  Join!: string;
  Where!: string;
  Note!: string;
  DataForJoin!: string;
  DataForWhere!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.RangeRoleUid === undefined || this.RangeRoleUid === null) {
      this.RangeRoleUid = 0;
    }
    if (this.TypeUid === undefined || this.TypeUid === null) {
      this.TypeUid = 0;
    }
    if (this.TableName === undefined || this.TableName === null) {
      this.TableName = '';
    }
    if (this.Permissions === undefined || this.Permissions === null) {
      this.Permissions = Permissions.浏览 ;
    }
    if (this.Join === undefined || this.Join === null) {
      this.Join = '';
    }
    if (this.Where === undefined || this.Where === null) {
      this.Where = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.DataForJoin === undefined || this.DataForJoin === null) {
      this.DataForJoin = '';
    }
    if (this.DataForWhere === undefined || this.DataForWhere === null) {
      this.DataForWhere = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemScriptBind.cs
export class SystemScriptBind extends NameRecord {
  PageUid!: number;
  PageName!: string;
  ScriptType!: ScriptType;
  ScriptGetter!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.PageUid === undefined || this.PageUid === null) {
      this.PageUid = 0;
    }
    if (this.PageName === undefined || this.PageName === null) {
      this.PageName = '';
    }
    if (this.ScriptType === undefined || this.ScriptType === null) {
      this.ScriptType = ScriptType.Lua ;
    }
    if (this.ScriptGetter === undefined || this.ScriptGetter === null) {
      this.ScriptGetter = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemServerCommandTrigger.cs
export class SystemServerCommandTrigger extends NameRecord {
  TypeUid!: number;
  ServerEventTiming!: ServerEventTiming;
  CommandKey!: string;
  CommandParameter!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TypeUid === undefined || this.TypeUid === null) {
      this.TypeUid = 0;
    }
    if (this.CommandKey === undefined || this.CommandKey === null) {
      this.CommandKey = '';
    }
    if (this.CommandParameter === undefined || this.CommandParameter === null) {
      this.CommandParameter = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForButton.cs
export class SystemSettingForButton extends NameRecord implements ISystemSetting {
  CommandKey!: string;
  ProcedureUid!: number;
  CommandParameter!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CommandKey === undefined || this.CommandKey === null) {
      this.CommandKey = '';
    }
    if (this.ProcedureUid === undefined || this.ProcedureUid === null) {
      this.ProcedureUid = 0;
    }
    if (this.CommandParameter === undefined || this.CommandParameter === null) {
      this.CommandParameter = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForComboBox.cs
export class SystemSettingForComboBox extends NameRecord implements ISystemSetting {
  DataViewUid!: number;
  ValueMember!: string;
  DisplayMember!: string;
  IsMultiSelect!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DataViewUid === undefined || this.DataViewUid === null) {
      this.DataViewUid = 0;
    }
    if (this.ValueMember === undefined || this.ValueMember === null) {
      this.ValueMember = '';
    }
    if (this.DisplayMember === undefined || this.DisplayMember === null) {
      this.DisplayMember = '';
    }
    if (this.IsMultiSelect === undefined || this.IsMultiSelect === null) {
      this.IsMultiSelect = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForCustomEnumControl.cs
export class SystemSettingForCustomEnumControl extends NameRecord implements ISystemSetting {
  EnumControlType!: EnumControlType;
  ParseRule!: string;
  PropertyParseRule!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EnumControlType === undefined || this.EnumControlType === null) {
      this.EnumControlType = EnumControlType.Text ;
    }
    if (this.ParseRule === undefined || this.ParseRule === null) {
      this.ParseRule = '';
    }
    if (this.PropertyParseRule === undefined || this.PropertyParseRule === null) {
      this.PropertyParseRule = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForDataGrid.cs
export class SystemSettingForDataGrid extends NameRecord implements ISystemSetting {
  DataViewUid!: number;
  DataGridMode!: DataGridMode;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DataViewUid === undefined || this.DataViewUid === null) {
      this.DataViewUid = 0;
    }
    if (this.DataGridMode === undefined || this.DataGridMode === null) {
      this.DataGridMode = DataGridMode.AllowDelete ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForDateTime.cs
export class SystemSettingForDateTime extends NameRecord implements ISystemSetting {
  IsUseFormat!: boolean;
  Format!: string;
  IsFilter!: boolean;
  DateTimeFilterType!: DateTimeFilterType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseFormat === undefined || this.IsUseFormat === null) {
      this.IsUseFormat = false;
    }
    if (this.Format === undefined || this.Format === null) {
      this.Format = '';
    }
    if (this.IsFilter === undefined || this.IsFilter === null) {
      this.IsFilter = false;
    }
    if (this.DateTimeFilterType === undefined || this.DateTimeFilterType === null) {
      this.DateTimeFilterType = DateTimeFilterType.Default;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForEnumComboBox.cs
export class SystemSettingForEnumComboBox extends NameRecord implements ISystemSetting {
  EnumType!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EnumType === undefined || this.EnumType === null) {
      this.EnumType = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForImage.cs
export class SystemSettingForImage extends NameRecord implements ISystemSetting {
  ImageType!: ImageType;
  ResourceName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ImageType === undefined || this.ImageType === null) {
      this.ImageType = ImageType.None ;
    }
    if (this.ResourceName === undefined || this.ResourceName === null) {
      this.ResourceName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForNumber.cs
export class SystemSettingForNumber extends NameRecord implements ISystemSetting {
  DecimalPlaces!: number;
  UseThousandsSeparator!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DecimalPlaces === undefined || this.DecimalPlaces === null) {
      this.DecimalPlaces = 0;
    }
    if (this.UseThousandsSeparator === undefined || this.UseThousandsSeparator === null) {
      this.UseThousandsSeparator = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForPanel.cs
export class SystemSettingForPanel extends NameRecord implements ISystemSetting, IPanelSetting {
  ViewType!: ViewType;
  DynamicParse!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DynamicParse === undefined || this.DynamicParse === null) {
      this.DynamicParse = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForStepProgressBar.cs
export class SystemSettingForStepProgressBar extends NameRecord implements ISystemSetting {
  Orientation!: Orientation;
  StepDisplayText!: string;
  StepDisplaySpace!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Orientation === undefined || this.Orientation === null) {
      this.Orientation = Orientation.Horizontal;
    }
    if (this.StepDisplayText === undefined || this.StepDisplayText === null) {
      this.StepDisplayText = '';
    }
    if (this.StepDisplaySpace === undefined || this.StepDisplaySpace === null) {
      this.StepDisplaySpace = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForTextBox.cs
export class SystemSettingForTextBox extends NameRecord implements ISystemSetting {
  FieldName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingForTreeView.cs
export class SystemSettingForTreeView extends NameRecord implements ISystemSetting {
  DataViewUid!: number;
  MainFieldName!: string;
  ParentFieldName!: string;
  ChildFieldName!: string;
  TreeViewMode!: TreeViewMode;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DataViewUid === undefined || this.DataViewUid === null) {
      this.DataViewUid = 0;
    }
    if (this.MainFieldName === undefined || this.MainFieldName === null) {
      this.MainFieldName = '';
    }
    if (this.ParentFieldName === undefined || this.ParentFieldName === null) {
      this.ParentFieldName = '';
    }
    if (this.ChildFieldName === undefined || this.ChildFieldName === null) {
      this.ChildFieldName = '';
    }
    if (this.TreeViewMode === undefined || this.TreeViewMode === null) {
      this.TreeViewMode = TreeViewMode.AllowDelete ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSettingTemplateListView.cs
export class SystemSettingTemplateListView extends NameRecord {
  ListItemTemplateType!: ListItemTemplateType;
  DataViewUid!: number;
  ViewUid!: number | null;
  TemplateUid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ListItemTemplateType === undefined || this.ListItemTemplateType === null) {
      this.ListItemTemplateType = ListItemTemplateType.None ;
    }
    if (this.DataViewUid === undefined || this.DataViewUid === null) {
      this.DataViewUid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemSpecialField.cs
export class SystemSpecialField extends NewRecord {
  Type!: SpecialFieldType;
  FieldName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemTemplateListView.cs
export class SystemTemplateListView extends NameRecord {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemTemplateListViewFieldControl.cs
export class SystemTemplateListViewFieldControl extends NameRecord {
  SystemTemplateListViewUid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.SystemTemplateListViewUid === undefined || this.SystemTemplateListViewUid === null) {
      this.SystemTemplateListViewUid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemType.cs
export class SystemType extends NewRecord {
  TableName!: string;
  Name!: string;
  BelongToModuleUid!: number;
  TypeSetting!: TypeSetting;
  AssociatedFeature!: AssociatedFeature;
  OtherOptionForSystemSetting!: OtherOptionForSystemSetting;
  DataUpdateTag!: DataUpdateTag;
  MutexGroup!: MutexGroup;
  InventoryBehavior!: InventoryBehavior;
  RoleEffect!: RoleEffect;
  BindEditorPageUid!: number | null;
  BindViewerPageUid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TableName === undefined || this.TableName === null) {
      this.TableName = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.BelongToModuleUid === undefined || this.BelongToModuleUid === null) {
      this.BelongToModuleUid = 0;
    }
    if (this.TypeSetting === undefined || this.TypeSetting === null) {
      this.TypeSetting = TypeSetting.Normal ;
    }
    if (this.AssociatedFeature === undefined || this.AssociatedFeature === null) {
      this.AssociatedFeature = AssociatedFeature.不会因为我存在而拦截上游反审批 ;
    }
    if (this.OtherOptionForSystemSetting === undefined || this.OtherOptionForSystemSetting === null) {
      this.OtherOptionForSystemSetting = OtherOptionForSystemSetting.升级账套时保留此设置 ;
    }
    if (this.DataUpdateTag === undefined || this.DataUpdateTag === null) {
      this.DataUpdateTag = DataUpdateTag.数据高频变动 ;
    }
    if (this.MutexGroup === undefined || this.MutexGroup === null) {
      this.MutexGroup = MutexGroup.A ;
    }
    if (this.InventoryBehavior === undefined || this.InventoryBehavior === null) {
      this.InventoryBehavior = InventoryBehavior.不影响 ;
    }
    if (this.RoleEffect === undefined || this.RoleEffect === null) {
      this.RoleEffect = RoleEffect.NotAffectedByBehaviorRole ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemUserDesignerForDataView.cs
export class SystemUserDesignerForDataView extends ErpRecord {
  EmployeeUid!: number;
  DataViewUid!: number;
  LayoutFileName!: string;
  LayoutFile!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EmployeeUid === undefined || this.EmployeeUid === null) {
      this.EmployeeUid = 0;
    }
    if (this.DataViewUid === undefined || this.DataViewUid === null) {
      this.DataViewUid = 0;
    }
    if (this.LayoutFileName === undefined || this.LayoutFileName === null) {
      this.LayoutFileName = '';
    }
    if (this.LayoutFile === undefined || this.LayoutFile === null) {
      this.LayoutFile = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemUserDesignerForDataViewField.cs
export class SystemUserDesignerForDataViewField extends ErpRecord {
  EmployeeUid!: number;
  DataViewUid!: number;
  FieldName!: string;
  DisplayIndex!: number;
  Width!: number;
  Visible!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EmployeeUid === undefined || this.EmployeeUid === null) {
      this.EmployeeUid = 0;
    }
    if (this.DataViewUid === undefined || this.DataViewUid === null) {
      this.DataViewUid = 0;
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
    if (this.DisplayIndex === undefined || this.DisplayIndex === null) {
      this.DisplayIndex = 0;
    }
    if (this.Width === undefined || this.Width === null) {
      this.Width = 0;
    }
    if (this.Visible === undefined || this.Visible === null) {
      this.Visible = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemView.cs
export class SystemView extends NameRecord implements IPanelSetting {
  Header!: string;
  ViewType!: ViewType;
  DynamicParse!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Header === undefined || this.Header === null) {
      this.Header = '';
    }
    if (this.DynamicParse === undefined || this.DynamicParse === null) {
      this.DynamicParse = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemViewWithFeatureAttach.cs
export class SystemViewWithFeatureAttach extends NewRecord {
  ViewUid!: number;
  TypeUid!: number;
  ViewFeatureType!: ViewFeatureType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ViewUid === undefined || this.ViewUid === null) {
      this.ViewUid = 0;
    }
    if (this.TypeUid === undefined || this.TypeUid === null) {
      this.TypeUid = 0;
    }
    if (this.ViewFeatureType === undefined || this.ViewFeatureType === null) {
      this.ViewFeatureType = ViewFeatureType.None ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemWindow.cs
export class SystemWindow extends NewRecord {
  Name!: string;
  Header!: string;
  BusinessCoreKey!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Header === undefined || this.Header === null) {
      this.Header = '';
    }
    if (this.BusinessCoreKey === undefined || this.BusinessCoreKey === null) {
      this.BusinessCoreKey = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemWindowViewLink.cs
export class SystemWindowViewLink extends NewRecord {
  WindowUid!: number;
  ViewUid!: number;
  Position!: Position;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.WindowUid === undefined || this.WindowUid === null) {
      this.WindowUid = 0;
    }
    if (this.ViewUid === undefined || this.ViewUid === null) {
      this.ViewUid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/UniqueEntity.cs
export class UniqueEntity implements IOrderEntity {
  id!: number;
  LocationIndex!: number;
  Uid!: number;
  CacheInt1!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (this.id === undefined || this.id === null) {
      this.id = 0;
    }
    if (this.LocationIndex === undefined || this.LocationIndex === null) {
      this.LocationIndex = 0;
    }
    if (this.Uid === undefined || this.Uid === null) {
      this.Uid = 0;
    }
    if (this.CacheInt1 === undefined || this.CacheInt1 === null) {
      this.CacheInt1 = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/Temporary/AccountsPayableDetail.cs
export class AccountsPayableDetail extends UniqueEntity implements IHasSupplier {
  DocumentCode!: string;
  DocumentTime!: string;
  DocumentApprovalTime!: string | null;
  DocumentCreateTime!: string | null;
  CreateTime!: string | null;
  Supplierid!: number;
  Materialid!: number;
  UnitPrice!: number | null;
  Qty!: number | null;
  DQty!: number | null;
  Unitid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DocumentCode === undefined || this.DocumentCode === null) {
      this.DocumentCode = '';
    }
    if (this.DocumentTime === undefined || this.DocumentTime === null) {
      this.DocumentTime = '';
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/Temporary/AccountsPayableDocument.cs
export class AccountsPayableDocument extends UniqueEntity implements IDocument, IHasSupplier {
  Code!: string;
  CreateTime!: string | null;
  CreateByUserid!: number;
  UpdateTime!: string | null;
  UpdateByUserid!: number | null;
  DocumentTime!: string;
  Status!: DocumentStatus;
  FinishTime!: string | null;
  FinishByUserid!: number | null;
  ApprovalTime!: string | null;
  ApprovalByUserid!: number | null;
  IsApproval!: boolean;
  CreateByDocumentid!: number | null;
  CreateByDocumentType!: string;
  CreateByDetailid!: number | null;
  CreateByDetailType!: string;
  Supplierid!: number;
  Year!: number;
  Stage!: number;
  CheckIntervalStart!: string;
  CheckIntervalEnd!: string;
  Note!: string;
  ModifyMode!: ModifyMode;
  GenerateById!: number;
  ParentModifyId!: number | null;
  ModifyTime!: string | null;
  ModifyEmployeeid!: number;
  FlowUid!: number;
  FlowLayer!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.CreateByUserid === undefined || this.CreateByUserid === null) {
      this.CreateByUserid = 0;
    }
    if (this.DocumentTime === undefined || this.DocumentTime === null) {
      this.DocumentTime = '';
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = DocumentStatus.未审批 ;
    }
    if (this.IsApproval === undefined || this.IsApproval === null) {
      this.IsApproval = false;
    }
    if (this.CreateByDocumentType === undefined || this.CreateByDocumentType === null) {
      this.CreateByDocumentType = '';
    }
    if (this.CreateByDetailType === undefined || this.CreateByDetailType === null) {
      this.CreateByDetailType = '';
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.Year === undefined || this.Year === null) {
      this.Year = 0;
    }
    if (this.Stage === undefined || this.Stage === null) {
      this.Stage = 0;
    }
    if (this.CheckIntervalStart === undefined || this.CheckIntervalStart === null) {
      this.CheckIntervalStart = '';
    }
    if (this.CheckIntervalEnd === undefined || this.CheckIntervalEnd === null) {
      this.CheckIntervalEnd = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.ModifyMode === undefined || this.ModifyMode === null) {
      this.ModifyMode = ModifyMode.未定义 ;
    }
    if (this.GenerateById === undefined || this.GenerateById === null) {
      this.GenerateById = 0;
    }
    if (this.ModifyEmployeeid === undefined || this.ModifyEmployeeid === null) {
      this.ModifyEmployeeid = 0;
    }
    if (this.FlowUid === undefined || this.FlowUid === null) {
      this.FlowUid = 0;
    }
    if (this.FlowLayer === undefined || this.FlowLayer === null) {
      this.FlowLayer = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/Temporary/AccountsReceivableDetail.cs
export class AccountsReceivableDetail extends UniqueEntity implements IHasClient {
  DocumentCode!: string;
  DocumentTime!: string;
  DocumentApprovalTime!: string | null;
  DocumentCreateTime!: string | null;
  CreateTime!: string | null;
  Clientid!: number;
  Materialid!: number;
  UnitPrice!: number | null;
  WeiShuiDanJia!: number | null;
  WeiShuiJinE!: number | null;
  Qty!: number | null;
  DQty!: number | null;
  Unitid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DocumentCode === undefined || this.DocumentCode === null) {
      this.DocumentCode = '';
    }
    if (this.DocumentTime === undefined || this.DocumentTime === null) {
      this.DocumentTime = '';
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/Temporary/AccountsReceivableDocument.cs
export class AccountsReceivableDocument extends UniqueEntity implements IDocument, IHasClient {
  Code!: string;
  CreateTime!: string | null;
  CreateByUserid!: number;
  UpdateTime!: string | null;
  UpdateByUserid!: number | null;
  DocumentTime!: string;
  Status!: DocumentStatus;
  FinishTime!: string | null;
  FinishByUserid!: number | null;
  ApprovalTime!: string | null;
  ApprovalByUserid!: number | null;
  IsApproval!: boolean;
  CreateByDocumentid!: number | null;
  CreateByDocumentType!: string;
  CreateByDetailid!: number | null;
  CreateByDetailType!: string;
  Clientid!: number;
  Year!: number;
  Stage!: number;
  CheckIntervalStart!: string;
  CheckIntervalEnd!: string;
  Note!: string;
  ModifyMode!: ModifyMode;
  GenerateById!: number;
  ParentModifyId!: number | null;
  ModifyTime!: string | null;
  ModifyEmployeeid!: number;
  FlowUid!: number;
  FlowLayer!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.CreateByUserid === undefined || this.CreateByUserid === null) {
      this.CreateByUserid = 0;
    }
    if (this.DocumentTime === undefined || this.DocumentTime === null) {
      this.DocumentTime = '';
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = DocumentStatus.未审批 ;
    }
    if (this.IsApproval === undefined || this.IsApproval === null) {
      this.IsApproval = false;
    }
    if (this.CreateByDocumentType === undefined || this.CreateByDocumentType === null) {
      this.CreateByDocumentType = '';
    }
    if (this.CreateByDetailType === undefined || this.CreateByDetailType === null) {
      this.CreateByDetailType = '';
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Year === undefined || this.Year === null) {
      this.Year = 0;
    }
    if (this.Stage === undefined || this.Stage === null) {
      this.Stage = 0;
    }
    if (this.CheckIntervalStart === undefined || this.CheckIntervalStart === null) {
      this.CheckIntervalStart = '';
    }
    if (this.CheckIntervalEnd === undefined || this.CheckIntervalEnd === null) {
      this.CheckIntervalEnd = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.ModifyMode === undefined || this.ModifyMode === null) {
      this.ModifyMode = ModifyMode.未定义 ;
    }
    if (this.GenerateById === undefined || this.GenerateById === null) {
      this.GenerateById = 0;
    }
    if (this.ModifyEmployeeid === undefined || this.ModifyEmployeeid === null) {
      this.ModifyEmployeeid = 0;
    }
    if (this.FlowUid === undefined || this.FlowUid === null) {
      this.FlowUid = 0;
    }
    if (this.FlowLayer === undefined || this.FlowLayer === null) {
      this.FlowLayer = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/ApprovalFlowTemplateDetailEmployee.cs
export class ApprovalFlowTemplateDetailEmployee extends UniqueEntity {
  ApprovalFlowTemplateDetailid!: number;
  Employeeid!: number;
  ApprovalFlowTemplateDetail!: ApprovalFlowTemplateDetail;
  Employee!: Employee;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ApprovalFlowTemplateDetailid === undefined || this.ApprovalFlowTemplateDetailid === null) {
      this.ApprovalFlowTemplateDetailid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.ApprovalFlowTemplateDetail === undefined || this.ApprovalFlowTemplateDetail === null) {
      this.ApprovalFlowTemplateDetail = new ApprovalFlowTemplateDetail();
    }
    if (this.Employee === undefined || this.Employee === null) {
      this.Employee = new Employee();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/ApprovalFlowTemplateDetailEmployeeJob.cs
export class ApprovalFlowTemplateDetailEmployeeJob extends UniqueEntity {
  ApprovalFlowTemplateDetailid!: number;
  EmployeeJobid!: number;
  ApprovalFlowTemplateDetail!: ApprovalFlowTemplateDetail;
  EmployeeJob!: EmployeeJob;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ApprovalFlowTemplateDetailid === undefined || this.ApprovalFlowTemplateDetailid === null) {
      this.ApprovalFlowTemplateDetailid = 0;
    }
    if (this.EmployeeJobid === undefined || this.EmployeeJobid === null) {
      this.EmployeeJobid = 0;
    }
    if (this.ApprovalFlowTemplateDetail === undefined || this.ApprovalFlowTemplateDetail === null) {
      this.ApprovalFlowTemplateDetail = new ApprovalFlowTemplateDetail();
    }
    if (this.EmployeeJob === undefined || this.EmployeeJob === null) {
      this.EmployeeJob = new EmployeeJob();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/AutoApprovalFlowEmployee.cs
export class AutoApprovalFlowEmployee extends UniqueEntity {
  AutoApprovalFlowid!: number;
  Employeeid!: number;
  AutoApprovalFlow!: AutoApprovalFlow;
  Employee!: Employee;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.AutoApprovalFlowid === undefined || this.AutoApprovalFlowid === null) {
      this.AutoApprovalFlowid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.AutoApprovalFlow === undefined || this.AutoApprovalFlow === null) {
      this.AutoApprovalFlow = new AutoApprovalFlow();
    }
    if (this.Employee === undefined || this.Employee === null) {
      this.Employee = new Employee();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/BatchFlowShuntConfigLinkOperator.cs
export class BatchFlowShuntConfigLinkOperator extends UniqueEntity {
  BatchFlowShuntConfigid!: number;
  Operatorid!: number;
  BatchFlowShuntConfig!: BatchFlowShuntConfig;
  Operator!: Employee;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BatchFlowShuntConfigid === undefined || this.BatchFlowShuntConfigid === null) {
      this.BatchFlowShuntConfigid = 0;
    }
    if (this.Operatorid === undefined || this.Operatorid === null) {
      this.Operatorid = 0;
    }
    if (this.BatchFlowShuntConfig === undefined || this.BatchFlowShuntConfig === null) {
      this.BatchFlowShuntConfig = new BatchFlowShuntConfig();
    }
    if (this.Operator === undefined || this.Operator === null) {
      this.Operator = new Employee();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/EntityBase.cs
export class EntityBase extends UniqueEntity implements IChangedInfo, IDeleteTag {
  CreateTime!: string | null;
  UpdateTime!: string | null;
  CreateByUserid!: number;
  UpdateByUserid!: number | null;
  LastChangeTime!: string;
  DeletedTag!: boolean;
  DeleteTime!: string | null;
  DeleteByUserid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CreateByUserid === undefined || this.CreateByUserid === null) {
      this.CreateByUserid = 0;
    }
    if (this.LastChangeTime === undefined || this.LastChangeTime === null) {
      this.LastChangeTime = '';
    }
    if (this.DeletedTag === undefined || this.DeletedTag === null) {
      this.DeletedTag = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/AutoApprovalFlow.cs
export class AutoApprovalFlow extends EntityBase {
  SysTypeid!: number;
  Details!: AutoApprovalFlowDetail[];
  IgnoreEmployee!: Employee[];
  SysType!: SysType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.SysTypeid === undefined || this.SysTypeid === null) {
      this.SysTypeid = 0;
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
    if (this.IgnoreEmployee === undefined || this.IgnoreEmployee === null) {
      this.IgnoreEmployee = [];
    }
    if (this.SysType === undefined || this.SysType === null) {
      this.SysType = new SysType();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/AutomatedOperationsMemorySupport.cs
export class AutomatedOperationsSupport extends EntityBase {
  From!: string;
  To!: string;
  Tag!: string;
  LastValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.From === undefined || this.From === null) {
      this.From = '';
    }
    if (this.To === undefined || this.To === null) {
      this.To = '';
    }
    if (this.Tag === undefined || this.Tag === null) {
      this.Tag = '';
    }
    if (this.LastValue === undefined || this.LastValue === null) {
      this.LastValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/BatchFlowShuntConfig.cs
export class BatchFlowShuntConfig extends EntityBase {
  BillUid!: number;
  DownStreamBillInfoUid!: number;
  BatchFlowShuntConfigFeature!: BatchFlowShuntConfigFeature;
  ComparedFields!: string;
  Select!: string;
  Where!: string;
  Join!: string;
  Note!: string;
  Emoloyees!: Employee[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BillUid === undefined || this.BillUid === null) {
      this.BillUid = 0;
    }
    if (this.DownStreamBillInfoUid === undefined || this.DownStreamBillInfoUid === null) {
      this.DownStreamBillInfoUid = 0;
    }
    if (this.ComparedFields === undefined || this.ComparedFields === null) {
      this.ComparedFields = '';
    }
    if (this.Select === undefined || this.Select === null) {
      this.Select = '';
    }
    if (this.Where === undefined || this.Where === null) {
      this.Where = '';
    }
    if (this.Join === undefined || this.Join === null) {
      this.Join = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Emoloyees === undefined || this.Emoloyees === null) {
      this.Emoloyees = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/BehavioralRole.cs
export class BehavioralRole extends EntityBase {
  Name!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/BehavioralRoleDetail.cs
export class BehavioralRoleDetail extends EntityBase {
  BehavioralRoleid!: number;
  PageName!: string;
  AllowAction!: Permissions;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BehavioralRoleid === undefined || this.BehavioralRoleid === null) {
      this.BehavioralRoleid = 0;
    }
    if (this.PageName === undefined || this.PageName === null) {
      this.PageName = '';
    }
    if (this.AllowAction === undefined || this.AllowAction === null) {
      this.AllowAction = Permissions.浏览 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/BillShuntConfig.cs
export class BillShuntConfig extends EntityBase {
  BillUid!: number;
  DownStreamBillInfoUid!: number;
  BillFeature!: BillFeature;
  Employeeid!: number;
  Where!: string;
  Join!: string;
  Note!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BillUid === undefined || this.BillUid === null) {
      this.BillUid = 0;
    }
    if (this.DownStreamBillInfoUid === undefined || this.DownStreamBillInfoUid === null) {
      this.DownStreamBillInfoUid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Where === undefined || this.Where === null) {
      this.Where = '';
    }
    if (this.Join === undefined || this.Join === null) {
      this.Join = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/ChannelConfigInfo.cs
export class ChannelConfigInfo extends EntityBase {
  FromTableName!: string;
  ToTableName!: string;
  ChannelConfigMode!: ChannelConfigMode;
  GenerateBehavior!: GenerateBehavior;
  ChannelQuantityControlMode!: ChannelQuantityControlMode;
  WhetherCompare!: boolean;
  ComparisionSubjectType!: ObjectBaseType;
  SourceProperty!: string;
  CompareTarget!: ChannelTarget;
  CompareProperty!: string;
  ReadPropertyInGenerate!: string;
  WritePropertyInGenerate!: string;
  ShareGroup!: TagFlags;
  ReverseWriteCondition!: string;
  ReverseWriteJoin!: string;
  ReadValueTarget!: ReverseWriteTarget;
  ReadValueProperty!: string;
  ReverseWriteTarget!: ReverseWriteTarget;
  ReverseWriteProperty!: string;
  ReverseWriteTiming!: ReverseWriteTiming;
  ReverseWriteMode!: ReverseWriteMode;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.FromTableName === undefined || this.FromTableName === null) {
      this.FromTableName = '';
    }
    if (this.ToTableName === undefined || this.ToTableName === null) {
      this.ToTableName = '';
    }
    if (this.GenerateBehavior === undefined || this.GenerateBehavior === null) {
      this.GenerateBehavior = GenerateBehavior.None ;
    }
    if (this.ChannelQuantityControlMode === undefined || this.ChannelQuantityControlMode === null) {
      this.ChannelQuantityControlMode = ChannelQuantityControlMode.不控制 ;
    }
    if (this.WhetherCompare === undefined || this.WhetherCompare === null) {
      this.WhetherCompare = false;
    }
    if (this.ComparisionSubjectType === undefined || this.ComparisionSubjectType === null) {
      this.ComparisionSubjectType = ObjectBaseType.Document;
    }
    if (this.SourceProperty === undefined || this.SourceProperty === null) {
      this.SourceProperty = '';
    }
    if (this.CompareTarget === undefined || this.CompareTarget === null) {
      this.CompareTarget = ChannelTarget.目标;
    }
    if (this.CompareProperty === undefined || this.CompareProperty === null) {
      this.CompareProperty = '';
    }
    if (this.ReadPropertyInGenerate === undefined || this.ReadPropertyInGenerate === null) {
      this.ReadPropertyInGenerate = '';
    }
    if (this.WritePropertyInGenerate === undefined || this.WritePropertyInGenerate === null) {
      this.WritePropertyInGenerate = '';
    }
    if (this.ShareGroup === undefined || this.ShareGroup === null) {
      this.ShareGroup = TagFlags.A ;
    }
    if (this.ReverseWriteCondition === undefined || this.ReverseWriteCondition === null) {
      this.ReverseWriteCondition = '';
    }
    if (this.ReverseWriteJoin === undefined || this.ReverseWriteJoin === null) {
      this.ReverseWriteJoin = '';
    }
    if (this.ReadValueTarget === undefined || this.ReadValueTarget === null) {
      this.ReadValueTarget = ReverseWriteTarget.目标;
    }
    if (this.ReadValueProperty === undefined || this.ReadValueProperty === null) {
      this.ReadValueProperty = '';
    }
    if (this.ReverseWriteTarget === undefined || this.ReverseWriteTarget === null) {
      this.ReverseWriteTarget = ReverseWriteTarget.目标;
    }
    if (this.ReverseWriteProperty === undefined || this.ReverseWriteProperty === null) {
      this.ReverseWriteProperty = '';
    }
    if (this.ReverseWriteTiming === undefined || this.ReverseWriteTiming === null) {
      this.ReverseWriteTiming = ReverseWriteTiming.SaveAndDelete ;
    }
    if (this.ReverseWriteMode === undefined || this.ReverseWriteMode === null) {
      this.ReverseWriteMode = ReverseWriteMode.覆盖 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ClientBusinessOwner.cs
export class ClientBusinessOwner extends EntityBase implements ICode, IPause {
  Name!: string;
  ShortName!: string;
  Code!: string;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.ShortName === undefined || this.ShortName === null) {
      this.ShortName = '';
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/ClientOpeningAccounts.cs
export class ClientOpeningAccounts extends EntityBase implements IEnabled, IHasClient {
  Clientid!: number;
  EffectiveTime!: string | null;
  OpeningAccounts!: number;
  EnabledTime!: string | null;
  EnabledByUserid!: number | null;
  IsEnabled!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.OpeningAccounts === undefined || this.OpeningAccounts === null) {
      this.OpeningAccounts = 0;
    }
    if (this.IsEnabled === undefined || this.IsEnabled === null) {
      this.IsEnabled = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/CodingRule.cs
export class CodingRule extends EntityBase {
  OwnerTypeName!: string;
  ValueType!: CodingRuleValueType;
  Type!: number;
  RuleFieldValue!: number;
  FieldName!: string;
  RefFieldName!: string;
  Format!: string;
  SubLength!: number | null;
  DefaultValue!: string;
  Prefix!: string;
  Suffix!: string;
  AuxiliaryGroup!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.OwnerTypeName === undefined || this.OwnerTypeName === null) {
      this.OwnerTypeName = '';
    }
    if (this.ValueType === undefined || this.ValueType === null) {
      this.ValueType = CodingRuleValueType.Field ;
    }
    if (this.Type === undefined || this.Type === null) {
      this.Type = 0;
    }
    if (this.RuleFieldValue === undefined || this.RuleFieldValue === null) {
      this.RuleFieldValue = 0;
    }
    if (this.FieldName === undefined || this.FieldName === null) {
      this.FieldName = '';
    }
    if (this.RefFieldName === undefined || this.RefFieldName === null) {
      this.RefFieldName = '';
    }
    if (this.Format === undefined || this.Format === null) {
      this.Format = '';
    }
    if (this.DefaultValue === undefined || this.DefaultValue === null) {
      this.DefaultValue = '';
    }
    if (this.Prefix === undefined || this.Prefix === null) {
      this.Prefix = '';
    }
    if (this.Suffix === undefined || this.Suffix === null) {
      this.Suffix = '';
    }
    if (this.AuxiliaryGroup === undefined || this.AuxiliaryGroup === null) {
      this.AuxiliaryGroup = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/CodingRuleCache.cs
export class CodingRuleCache extends EntityBase {
  OwnerTypeName!: string;
  ValueType!: CodingRuleValueType;
  Tag!: string;
  DateTag!: string | null;
  AuxiliaryGroup!: number | null;
  SerialNumber!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.OwnerTypeName === undefined || this.OwnerTypeName === null) {
      this.OwnerTypeName = '';
    }
    if (this.ValueType === undefined || this.ValueType === null) {
      this.ValueType = CodingRuleValueType.Field ;
    }
    if (this.Tag === undefined || this.Tag === null) {
      this.Tag = '';
    }
    if (this.SerialNumber === undefined || this.SerialNumber === null) {
      this.SerialNumber = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ContractTemplate.cs
export class ContractTemplate extends EntityBase {
  Name!: string;
  Details!: ContractTemplateDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/EquipmentComponent.cs
export class EquipmentComponent extends EntityBase {
  Equipmentid!: number;
  ComponentNumber!: number;
  Name!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.ComponentNumber === undefined || this.ComponentNumber === null) {
      this.ComponentNumber = 0;
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/EquipmentMaterial.cs
export class EquipmentMaterial extends EntityBase {
  Equipmentid!: number;
  Materialid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/FlowParameterSetting.cs
export class FlowParameterSetting extends EntityBase {
  BillTableName!: string;
  ParameterGroup!: FlowParameter;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BillTableName === undefined || this.BillTableName === null) {
      this.BillTableName = '';
    }
    if (this.ParameterGroup === undefined || this.ParameterGroup === null) {
      this.ParameterGroup = FlowParameter.启用分卡 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/GeneralEntityBase.cs
export class GeneralEntityBase extends EntityBase implements INode {
  Parentid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/AccessoryBarCode.cs
export class AccessoryBarCode extends GeneralEntityBase implements ICanBeGenerated, IScanCode, ICanBeGeneratedV2, IBringProcess, IOnlyHasMaterial, IInnerKey {
  CreateByEntityid!: number | null;
  CreateByEntityType!: string;
  InnerKey!: string;
  IsUseBringProcess!: boolean;
  BelongEntityid!: number;
  BelongEntityTableName!: string;
  Materialid!: number;
  Qty!: number;
  DQty!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  Comment!: string;
  CodeForScan!: string;
  CreateByDocumentid!: number | null;
  CreateByDocumentType!: string;
  CreateByDetailid!: number | null;
  CreateByDetailType!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CreateByEntityType === undefined || this.CreateByEntityType === null) {
      this.CreateByEntityType = '';
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.IsUseBringProcess === undefined || this.IsUseBringProcess === null) {
      this.IsUseBringProcess = false;
    }
    if (this.BelongEntityid === undefined || this.BelongEntityid === null) {
      this.BelongEntityid = 0;
    }
    if (this.BelongEntityTableName === undefined || this.BelongEntityTableName === null) {
      this.BelongEntityTableName = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.Comment === undefined || this.Comment === null) {
      this.Comment = '';
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
    if (this.CreateByDocumentType === undefined || this.CreateByDocumentType === null) {
      this.CreateByDocumentType = '';
    }
    if (this.CreateByDetailType === undefined || this.CreateByDetailType === null) {
      this.CreateByDetailType = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AccountInfo.cs
export class AccountInfo extends GeneralEntityBase {
  Name!: string;
  AccountType!: AccountType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.AccountType === undefined || this.AccountType === null) {
      this.AccountType = AccountType.现金账户;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/ApprovalFlowInstance.cs
export class ApprovalFlowInstance extends GeneralEntityBase {
  CreateByEntityid!: number;
  CreateByEntityType!: string;
  Round!: number;
  State!: ApprovalState;
  Matter!: string;
  Employeeid!: number;
  EmployeeJobid!: number;
  Mechanisms!: ApprovalMechanisms;
  Step!: number;
  Comment!: string;
  Employee!: Employee;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CreateByEntityid === undefined || this.CreateByEntityid === null) {
      this.CreateByEntityid = 0;
    }
    if (this.CreateByEntityType === undefined || this.CreateByEntityType === null) {
      this.CreateByEntityType = '';
    }
    if (this.Round === undefined || this.Round === null) {
      this.Round = 0;
    }
    if (this.State === undefined || this.State === null) {
      this.State = ApprovalState.Undefined;
    }
    if (this.Matter === undefined || this.Matter === null) {
      this.Matter = '';
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.EmployeeJobid === undefined || this.EmployeeJobid === null) {
      this.EmployeeJobid = 0;
    }
    if (this.Mechanisms === undefined || this.Mechanisms === null) {
      this.Mechanisms = ApprovalMechanisms.Any ;
    }
    if (this.Step === undefined || this.Step === null) {
      this.Step = 0;
    }
    if (this.Comment === undefined || this.Comment === null) {
      this.Comment = '';
    }
    if (this.Employee === undefined || this.Employee === null) {
      this.Employee = new Employee();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/ApprovalFlowTemplate.cs
export class ApprovalFlowTemplate extends GeneralEntityBase {
  Name!: string;
  SysTypeid!: number;
  BehaviorParameter!: ApprovalFlowBehaviorParameter;
  Details!: ApprovalFlowTemplateDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.SysTypeid === undefined || this.SysTypeid === null) {
      this.SysTypeid = 0;
    }
    if (this.BehaviorParameter === undefined || this.BehaviorParameter === null) {
      this.BehaviorParameter = ApprovalFlowBehaviorParameter.Undefined;
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/BillOfMaterial.cs
export class BillOfMaterial extends GeneralEntityBase implements IApprovalEntity {
  ApprovalTime!: string | null;
  ApprovalByUserid!: number | null;
  IsApproval!: boolean;
  Status!: DocumentStatus;
  Materialid!: number;
  Qty!: number;
  DQty!: number;
  Note!: string;
  CopperUsed!: number;
  InsulationLayerUsed!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsApproval === undefined || this.IsApproval === null) {
      this.IsApproval = false;
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = DocumentStatus.未审批 ;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.CopperUsed === undefined || this.CopperUsed === null) {
      this.CopperUsed = 0;
    }
    if (this.InsulationLayerUsed === undefined || this.InsulationLayerUsed === null) {
      this.InsulationLayerUsed = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckCard.cs
export class CheckCard extends GeneralEntityBase implements IFile, IEnabled {
  EnabledTime!: string | null;
  EnabledByUserid!: number | null;
  IsEnabled!: boolean;
  Materialid!: number;
  CloudFileid!: number;
  FileName!: string;
  Suffix!: string;
  FileDescription!: string;
  Bytes!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsEnabled === undefined || this.IsEnabled === null) {
      this.IsEnabled = false;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.CloudFileid === undefined || this.CloudFileid === null) {
      this.CloudFileid = 0;
    }
    if (this.FileName === undefined || this.FileName === null) {
      this.FileName = '';
    }
    if (this.Suffix === undefined || this.Suffix === null) {
      this.Suffix = '';
    }
    if (this.FileDescription === undefined || this.FileDescription === null) {
      this.FileDescription = '';
    }
    if (this.Bytes === undefined || this.Bytes === null) {
      this.Bytes = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckMethod.cs
export class CheckMethod extends GeneralEntityBase {
  Name!: string;
  BindSamplingInspectionRuleid!: number | null;
  BindInspectionLevel!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.BindInspectionLevel === undefined || this.BindInspectionLevel === null) {
      this.BindInspectionLevel = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/ChildEntityBase.cs
export class ChildEntityBase extends GeneralEntityBase implements IChild {
  ParentTypeid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ParentTypeid === undefined || this.ParentTypeid === null) {
      this.ParentTypeid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/ApprovalFlowTemplateDetail.cs
export class ApprovalFlowTemplateDetail extends ChildEntityBase {
  Matter!: string;
  EmployeeMembers!: Employee[];
  EmployeeJobMembers!: EmployeeJob[];
  Mechanisms!: ApprovalMechanisms;
  Step!: number;
  Condition!: string;
  Join!: string;
  Document!: ApprovalFlowTemplate;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Matter === undefined || this.Matter === null) {
      this.Matter = '';
    }
    if (this.EmployeeMembers === undefined || this.EmployeeMembers === null) {
      this.EmployeeMembers = [];
    }
    if (this.EmployeeJobMembers === undefined || this.EmployeeJobMembers === null) {
      this.EmployeeJobMembers = [];
    }
    if (this.Mechanisms === undefined || this.Mechanisms === null) {
      this.Mechanisms = ApprovalMechanisms.Any ;
    }
    if (this.Step === undefined || this.Step === null) {
      this.Step = 0;
    }
    if (this.Condition === undefined || this.Condition === null) {
      this.Condition = '';
    }
    if (this.Join === undefined || this.Join === null) {
      this.Join = '';
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new ApprovalFlowTemplate();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/AutoApprovalFlowDetail.cs
export class AutoApprovalFlowDetail extends ChildEntityBase {
  UseTemplateid!: number;
  Condition!: string;
  Join!: string;
  OrderIndex!: number;
  Note!: string;
  ApprovalFlowTemplate!: ApprovalFlowTemplate;
  AutoApprovalFlow!: AutoApprovalFlow;
  Document!: ApprovalFlowTemplate;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.UseTemplateid === undefined || this.UseTemplateid === null) {
      this.UseTemplateid = 0;
    }
    if (this.Condition === undefined || this.Condition === null) {
      this.Condition = '';
    }
    if (this.Join === undefined || this.Join === null) {
      this.Join = '';
    }
    if (this.OrderIndex === undefined || this.OrderIndex === null) {
      this.OrderIndex = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.ApprovalFlowTemplate === undefined || this.ApprovalFlowTemplate === null) {
      this.ApprovalFlowTemplate = new ApprovalFlowTemplate();
    }
    if (this.AutoApprovalFlow === undefined || this.AutoApprovalFlow === null) {
      this.AutoApprovalFlow = new AutoApprovalFlow();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new ApprovalFlowTemplate();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/CloudFile.cs
export class CloudFile extends GeneralEntityBase {
  FileMd5!: string;
  Size!: number;
  UploadBytesTemp!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.FileMd5 === undefined || this.FileMd5 === null) {
      this.FileMd5 = '';
    }
    if (this.Size === undefined || this.Size === null) {
      this.Size = 0;
    }
    if (this.UploadBytesTemp === undefined || this.UploadBytesTemp === null) {
      this.UploadBytesTemp = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/ConditionalPrinting.cs
export class ConditionalPrinting extends GeneralEntityBase {
  PageName!: string;
  MainTableName!: string;
  PrintTemplateid!: number;
  Operatorid!: number;
  Step!: number;
  ConditionNote!: string;
  Condition!: string;
  Join!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.PageName === undefined || this.PageName === null) {
      this.PageName = '';
    }
    if (this.MainTableName === undefined || this.MainTableName === null) {
      this.MainTableName = '';
    }
    if (this.PrintTemplateid === undefined || this.PrintTemplateid === null) {
      this.PrintTemplateid = 0;
    }
    if (this.Operatorid === undefined || this.Operatorid === null) {
      this.Operatorid = 0;
    }
    if (this.Step === undefined || this.Step === null) {
      this.Step = 0;
    }
    if (this.ConditionNote === undefined || this.ConditionNote === null) {
      this.ConditionNote = '';
    }
    if (this.Condition === undefined || this.Condition === null) {
      this.Condition = '';
    }
    if (this.Join === undefined || this.Join === null) {
      this.Join = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ContractTemplateDetail.cs
export class ContractTemplateDetail extends ChildEntityBase {
  Key!: string;
  Value!: string;
  ContractTemplate!: ContractTemplate;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Key === undefined || this.Key === null) {
      this.Key = '';
    }
    if (this.Value === undefined || this.Value === null) {
      this.Value = '';
    }
    if (this.ContractTemplate === undefined || this.ContractTemplate === null) {
      this.ContractTemplate = new ContractTemplate();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/DataDictionary.cs
export class DataDictionary extends GeneralEntityBase {
  Name!: string;
  ValueType!: any;
  Value!: string;
  CanNotDelete!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Value === undefined || this.Value === null) {
      this.Value = '';
    }
    if (this.CanNotDelete === undefined || this.CanNotDelete === null) {
      this.CanNotDelete = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/DebtItem.cs
export class DebtItem extends GeneralEntityBase {
  Name!: string;
  DebtType!: DebtType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.DebtType === undefined || this.DebtType === null) {
      this.DebtType = DebtType.收;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Department.cs
export class Department extends GeneralEntityBase implements ICode {
  Code!: string;
  Name!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/DetailEntityBase.cs
export class DetailEntityBase extends ChildEntityBase implements ICanBeGenerated, IDetail, IScanCode, IPrintRecord {
  CreateByDocumentid!: number | null;
  CreateByDocumentType!: string;
  CreateByDetailid!: number | null;
  CreateByDetailType!: string;
  Status!: DocumentStatus;
  FinishTime!: string | null;
  FinishByUserid!: number | null;
  Note!: string;
  CodeForScan!: string;
  LastPrintUserid!: number | null;
  LastPrintUserUid!: number | null;
  LastPrintTime!: string | null;
  PrintCount!: number;
  ModifyMode!: ModifyMode;
  GenerateById!: number;
  ParentModifyId!: number | null;
  ModifyTime!: string;
  ModifyEmployeeid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CreateByDocumentType === undefined || this.CreateByDocumentType === null) {
      this.CreateByDocumentType = '';
    }
    if (this.CreateByDetailType === undefined || this.CreateByDetailType === null) {
      this.CreateByDetailType = '';
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = DocumentStatus.未审批 ;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
    if (this.PrintCount === undefined || this.PrintCount === null) {
      this.PrintCount = 0;
    }
    if (this.ModifyMode === undefined || this.ModifyMode === null) {
      this.ModifyMode = ModifyMode.未定义 ;
    }
    if (this.GenerateById === undefined || this.GenerateById === null) {
      this.GenerateById = 0;
    }
    if (this.ModifyTime === undefined || this.ModifyTime === null) {
      this.ModifyTime = '';
    }
    if (this.ModifyEmployeeid === undefined || this.ModifyEmployeeid === null) {
      this.ModifyEmployeeid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssembleBoxCompleteDetail.cs
export class AssembleBoxCompleteDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IBringProcess, IDelivery, IScanCode, IUseBom, IUnit, IDUnit, IInnerKey {
  IsUseBringProcess!: boolean;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  InnerKey!: string;
  Qty!: number;
  DQty!: number;
  DeliveryTime!: string | null;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseBringProcess === undefined || this.IsUseBringProcess === null) {
      this.IsUseBringProcess = false;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssembleBoxDetail.cs
export class AssembleBoxDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IScanCode, IUnit, IDUnit {
  CaseNumber!: string;
  Materialid!: number;
  Warehouseid!: number;
  Qty!: number;
  DQty!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  BoxedQuantity!: number;
  Document!: ExtrusionPlanDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CaseNumber === undefined || this.CaseNumber === null) {
      this.CaseNumber = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.BoxedQuantity === undefined || this.BoxedQuantity === null) {
      this.BoxedQuantity = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new ExtrusionPlanDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssemblePackDetail.cs
export class AssemblePackDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IScanCode, IUseBom, IUnit, IDUnit, IInnerKey {
  InnerKey!: string;
  Materialid!: number;
  Warehouseid!: number;
  Employeeid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  ContractNum!: string;
  BarCode!: string;
  ChintSerialNumber!: string;
  LegrandBarCode!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  Document!: ExtrusionPlanDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.BarCode === undefined || this.BarCode === null) {
      this.BarCode = '';
    }
    if (this.ChintSerialNumber === undefined || this.ChintSerialNumber === null) {
      this.ChintSerialNumber = '';
    }
    if (this.LegrandBarCode === undefined || this.LegrandBarCode === null) {
      this.LegrandBarCode = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new ExtrusionPlanDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssemblyCompleteDetail.cs
export class AssemblyCompleteDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IBringProcess, IDelivery, IScanCode, IUseBom, IUnit, IDUnit, IInnerKey {
  Sinourid!: number | null;
  SinourDocumentid!: number | null;
  IsUseBringProcess!: boolean;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  InnerKey!: string;
  Qty!: number;
  DQty!: number;
  DeliveryTime!: string | null;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  ProcessAssemblyFlowDetailid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseBringProcess === undefined || this.IsUseBringProcess === null) {
      this.IsUseBringProcess = false;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/AssemblyFlowDetail.cs
export class AssemblyFlowDetail extends DetailEntityBase {
  SubPosition!: number;
  TypeofWorkid!: number;
  ProductProcessDetailid!: number;
  VestInid!: number;
  BQty!: number;
  PreCmpBQty!: number;
  BadBQty!: number;
  CmpBQty!: number;
  WorkPriceBase!: number;
  WorkPrice!: number;
  PieceRateWage!: number;
  OIPAmount!: number;
  Content!: string;
  WorkRequirements!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.SubPosition === undefined || this.SubPosition === null) {
      this.SubPosition = 0;
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.ProductProcessDetailid === undefined || this.ProductProcessDetailid === null) {
      this.ProductProcessDetailid = 0;
    }
    if (this.VestInid === undefined || this.VestInid === null) {
      this.VestInid = 0;
    }
    if (this.BQty === undefined || this.BQty === null) {
      this.BQty = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.BadBQty === undefined || this.BadBQty === null) {
      this.BadBQty = 0;
    }
    if (this.CmpBQty === undefined || this.CmpBQty === null) {
      this.CmpBQty = 0;
    }
    if (this.WorkPriceBase === undefined || this.WorkPriceBase === null) {
      this.WorkPriceBase = 0;
    }
    if (this.WorkPrice === undefined || this.WorkPrice === null) {
      this.WorkPrice = 0;
    }
    if (this.PieceRateWage === undefined || this.PieceRateWage === null) {
      this.PieceRateWage = 0;
    }
    if (this.OIPAmount === undefined || this.OIPAmount === null) {
      this.OIPAmount = 0;
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.WorkRequirements === undefined || this.WorkRequirements === null) {
      this.WorkRequirements = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/AssemblyProcessCompletionDefectiveReworkOrderCheckDetail.cs
export class AssemblyProcessCompletionDefectiveReworkOrderCheckDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/AssemblyProcessCompletionDefectiveReworkOrderDetail.cs
export class AssemblyProcessCompletionDefectiveReworkOrderDetail extends DetailEntityBase {
  Adversesituation!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Adversesituation === undefined || this.Adversesituation === null) {
      this.Adversesituation = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/AssemblyProcessCompletionDetail.cs
export class AssemblyProcessCompletionDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/AssemblyProcessReceiveDefectiveReworkOrderCheckDetail.cs
export class AssemblyProcessReceiveDefectiveReworkOrderCheckDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/AssemblyProcessReceiveDefectiveReworkOrderDetail.cs
export class AssemblyProcessReceiveDefectiveReworkOrderDetail extends DetailEntityBase {
  Adversesituation!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Adversesituation === undefined || this.Adversesituation === null) {
      this.Adversesituation = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/AssemblyProcessReceiveDetail.cs
export class AssemblyProcessReceiveDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckBillDetail.cs
export class CheckBillDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckCaseDetail.cs
export class CheckCaseDetail extends DetailEntityBase implements ICheckCaseDetail {
  ProjectName!: string;
  Frequency!: string;
  Method!: string;
  Content!: string;
  DownQValue!: string;
  UpQValue!: string;
  AQL!: string;
  ACRE!: string;
  CmpQValue!: string;
  Value1!: string;
  Value2!: string;
  Value3!: string;
  Value4!: string;
  Value5!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
    if (this.Value1 === undefined || this.Value1 === null) {
      this.Value1 = '';
    }
    if (this.Value2 === undefined || this.Value2 === null) {
      this.Value2 = '';
    }
    if (this.Value3 === undefined || this.Value3 === null) {
      this.Value3 = '';
    }
    if (this.Value4 === undefined || this.Value4 === null) {
      this.Value4 = '';
    }
    if (this.Value5 === undefined || this.Value5 === null) {
      this.Value5 = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckCompleteDetail.cs
export class CheckCompleteDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/CollectionDetail.cs
export class CollectionDetail extends DetailEntityBase {
  Receivables!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Receivables === undefined || this.Receivables === null) {
      this.Receivables = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Component/ComponentDemandDetail.cs
export class ComponentDemandDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IUseBom, IUnit, IDUnit {
  RawCmpBQty!: number;
  MinCmpBQty!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  ContractNum!: string;
  DeliveryTime!: string | null;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  Document!: ComponentDemandDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.RawCmpBQty === undefined || this.RawCmpBQty === null) {
      this.RawCmpBQty = 0;
    }
    if (this.MinCmpBQty === undefined || this.MinCmpBQty === null) {
      this.MinCmpBQty = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new ComponentDemandDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/DailyPlanDetail.cs
export class DailyPlanDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IScanCode, IBringProcess, IInspectionRequired, IUseBom, IUnit, IDUnit, IInnerKey, IProcessProgress {
  IsUseInspectionRequired!: boolean;
  IsUseBringProcess!: boolean;
  InnerKey!: string;
  Materialid!: number;
  Warehouseid!: number;
  Equipmentid!: number;
  EquipmentComponentid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  ContractNum!: string;
  DeliveryTime!: string | null;
  MinCmpBQty!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  FurnacePlacement!: FurnacePlacement | null;
  EquipmentStartTime!: string | null;
  ProcessTime!: string | null;
  ProcessTypeofWorkid!: number;
  ProcessStatus!: ProcessStatus;
  ProcessQty!: number;
  ProcessStepCount!: number;
  ProcessCurrentStep!: number;
  ProcessSubmitSumQty!: number;
  Document!: DailyPlanDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseInspectionRequired === undefined || this.IsUseInspectionRequired === null) {
      this.IsUseInspectionRequired = false;
    }
    if (this.IsUseBringProcess === undefined || this.IsUseBringProcess === null) {
      this.IsUseBringProcess = false;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.EquipmentComponentid === undefined || this.EquipmentComponentid === null) {
      this.EquipmentComponentid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.MinCmpBQty === undefined || this.MinCmpBQty === null) {
      this.MinCmpBQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.ProcessTypeofWorkid === undefined || this.ProcessTypeofWorkid === null) {
      this.ProcessTypeofWorkid = 0;
    }
    if (this.ProcessStatus === undefined || this.ProcessStatus === null) {
      this.ProcessStatus = ProcessStatus.未开始 ;
    }
    if (this.ProcessQty === undefined || this.ProcessQty === null) {
      this.ProcessQty = 0;
    }
    if (this.ProcessStepCount === undefined || this.ProcessStepCount === null) {
      this.ProcessStepCount = 0;
    }
    if (this.ProcessCurrentStep === undefined || this.ProcessCurrentStep === null) {
      this.ProcessCurrentStep = 0;
    }
    if (this.ProcessSubmitSumQty === undefined || this.ProcessSubmitSumQty === null) {
      this.ProcessSubmitSumQty = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new DailyPlanDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/DefectiveReworkOrderCheckDetail.cs
export class DefectiveReworkOrderCheckDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/DefectiveReworkOrderDetail.cs
export class DefectiveReworkOrderDetail extends DetailEntityBase {
  Adversesituation!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Adversesituation === undefined || this.Adversesituation === null) {
      this.Adversesituation = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/DemandAnalysisDetail.cs
export class DemandAnalysisDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IUseBom, IUnit, IDUnit {
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  ContractNum!: string;
  DeliveryTime!: string | null;
  RawCmpBQty!: number;
  MinCmpBQty!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  Document!: DemandAnalysisDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.RawCmpBQty === undefined || this.RawCmpBQty === null) {
      this.RawCmpBQty = 0;
    }
    if (this.MinCmpBQty === undefined || this.MinCmpBQty === null) {
      this.MinCmpBQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new DemandAnalysisDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/DocumentBase.cs
export class DocumentBase extends GeneralEntityBase implements IDocument, ICode, IPrintRecord, IScanCode {
  DocumentTime!: string;
  Code!: string;
  CreateByDocumentid!: number | null;
  CreateByDocumentType!: string;
  CreateByDetailid!: number | null;
  CreateByDetailType!: string;
  ApprovalTime!: string | null;
  ApprovalByUserid!: number | null;
  IsApproval!: boolean;
  Status!: DocumentStatus;
  FinishTime!: string | null;
  FinishByUserid!: number | null;
  Note!: string;
  LastPrintUserid!: number | null;
  LastPrintUserUid!: number | null;
  LastPrintTime!: string | null;
  PrintCount!: number;
  CodeForScan!: string;
  ModifyMode!: ModifyMode;
  GenerateById!: number;
  ParentModifyId!: number | null;
  ModifyTime!: string | null;
  ModifyEmployeeid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DocumentTime === undefined || this.DocumentTime === null) {
      this.DocumentTime = '';
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.CreateByDocumentType === undefined || this.CreateByDocumentType === null) {
      this.CreateByDocumentType = '';
    }
    if (this.CreateByDetailType === undefined || this.CreateByDetailType === null) {
      this.CreateByDetailType = '';
    }
    if (this.IsApproval === undefined || this.IsApproval === null) {
      this.IsApproval = false;
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = DocumentStatus.未审批 ;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.PrintCount === undefined || this.PrintCount === null) {
      this.PrintCount = 0;
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
    if (this.ModifyMode === undefined || this.ModifyMode === null) {
      this.ModifyMode = ModifyMode.未定义 ;
    }
    if (this.GenerateById === undefined || this.GenerateById === null) {
      this.GenerateById = 0;
    }
    if (this.ModifyEmployeeid === undefined || this.ModifyEmployeeid === null) {
      this.ModifyEmployeeid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssembleBoxCompleteDocument.cs
export class AssembleBoxCompleteDocument extends DocumentBase implements IInnerKey {
  Departmentid!: number;
  InnerKey!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssembleBoxDocument.cs
export class AssembleBoxDocument extends DocumentBase {
  Departmentid!: number;
  Employeeid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssemblePackDocument.cs
export class AssemblePackDocument extends DocumentBase {
  Departmentid!: number;
  Employeeid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/AssemblyCompleteDocument.cs
export class AssemblyCompleteDocument extends DocumentBase implements IInnerKey {
  Sinourid!: number | null;
  SinourApprovalTime!: string | null;
  Departmentid!: number;
  InnerKey!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/AssemblyFlowDocument.cs
export class AssemblyFlowDocument extends DocumentBase implements IDelivery, IHasClient, IInnerKey {
  InnerKey!: string;
  Materialid!: number;
  Departmentid!: number;
  Clientid!: number;
  DeliveryTime!: string | null;
  PreCmpBQty!: number;
  CmpBQty!: number;
  BQty!: number;
  RoutingDocumentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.CmpBQty === undefined || this.CmpBQty === null) {
      this.CmpBQty = 0;
    }
    if (this.BQty === undefined || this.BQty === null) {
      this.BQty = 0;
    }
    if (this.RoutingDocumentid === undefined || this.RoutingDocumentid === null) {
      this.RoutingDocumentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/AssemblyProcessCompletionDefectiveReworkOrderDocument.cs
export class AssemblyProcessCompletionDefectiveReworkOrderDocument extends DocumentBase implements IInnerKey {
  Materialid!: number;
  Departmentid!: number;
  DutyDepartmentid!: number;
  Employeeid!: number;
  Clientid!: number;
  CheckMethodid!: number;
  DeliveryTime!: string | null;
  RepairTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  InnerKey!: string;
  TypeofWorkid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.DutyDepartmentid === undefined || this.DutyDepartmentid === null) {
      this.DutyDepartmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/AssemblyProcessCompletionDocument.cs
export class AssemblyProcessCompletionDocument extends DocumentBase implements IFlowCardProcessCompletionDocument, IInnerKey, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Warehouseid!: number;
  Employeeid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckResult!: CheckResult;
  TypeofWorkid!: number;
  PreCmpBQty!: number;
  PreCmpQty!: number;
  ChkBQty!: number;
  ChkQty!: number;
  PassBQty!: number;
  PassQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  NotPassQty!: number;
  InnerKey!: string;
  WaitCompleteQty!: number;
  IsScrap!: boolean;
  IsSplit!: boolean;
  UnfinishedReasonsid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.PreCmpQty === undefined || this.PreCmpQty === null) {
      this.PreCmpQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.ChkQty === undefined || this.ChkQty === null) {
      this.ChkQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassQty === undefined || this.PassQty === null) {
      this.PassQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.NotPassQty === undefined || this.NotPassQty === null) {
      this.NotPassQty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.WaitCompleteQty === undefined || this.WaitCompleteQty === null) {
      this.WaitCompleteQty = 0;
    }
    if (this.IsScrap === undefined || this.IsScrap === null) {
      this.IsScrap = false;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.UnfinishedReasonsid === undefined || this.UnfinishedReasonsid === null) {
      this.UnfinishedReasonsid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/AssemblyProcessReceiveDefectiveReworkOrderDocument.cs
export class AssemblyProcessReceiveDefectiveReworkOrderDocument extends DocumentBase implements IInnerKey {
  Materialid!: number;
  Departmentid!: number;
  DutyDepartmentid!: number;
  Employeeid!: number;
  Clientid!: number;
  CheckMethodid!: number;
  DeliveryTime!: string | null;
  RepairTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  InnerKey!: string;
  TypeofWorkid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.DutyDepartmentid === undefined || this.DutyDepartmentid === null) {
      this.DutyDepartmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/AssemblyProcessReceiveDocument.cs
export class AssemblyProcessReceiveDocument extends DocumentBase implements IFlowCardProcessReceiveDocument, IInnerKey, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Warehouseid!: number;
  Employeeid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckResult!: CheckResult;
  TypeofWorkid!: number;
  PreCmpBQty!: number;
  PreCmpQty!: number;
  ChkBQty!: number;
  ChkQty!: number;
  PassBQty!: number;
  PassQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  NotPassQty!: number;
  InnerKey!: string;
  WaitReceivedQty!: number;
  IsScrap!: boolean;
  IsSplit!: boolean;
  UnfinishedReasonsid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.PreCmpQty === undefined || this.PreCmpQty === null) {
      this.PreCmpQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.ChkQty === undefined || this.ChkQty === null) {
      this.ChkQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassQty === undefined || this.PassQty === null) {
      this.PassQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.NotPassQty === undefined || this.NotPassQty === null) {
      this.NotPassQty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.WaitReceivedQty === undefined || this.WaitReceivedQty === null) {
      this.WaitReceivedQty = 0;
    }
    if (this.IsScrap === undefined || this.IsScrap === null) {
      this.IsScrap = false;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.UnfinishedReasonsid === undefined || this.UnfinishedReasonsid === null) {
      this.UnfinishedReasonsid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckBillDocument.cs
export class CheckBillDocument extends DocumentBase implements IHasSupplier, IOnlyHasMaterial, IHasEmployee, IQty, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Employeeid!: number;
  Supplierid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckDeliveryTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  Cname!: string;
  SeverityLevel!: SeverityLevel;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.Cname === undefined || this.Cname === null) {
      this.Cname = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckCaseDocument.cs
export class CheckCaseDocument extends DocumentBase {
  Name!: string;
  CheckMethodid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/CheckCompleteDocument.cs
export class CheckCompleteDocument extends DocumentBase implements IHasClient, IOnlyHasMaterial, IHasEmployee, IInnerKey, IQty, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Employeeid!: number;
  Clientid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckDeliveryTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  Cname!: string;
  InnerKey!: string;
  SeverityLevel!: SeverityLevel;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.Cname === undefined || this.Cname === null) {
      this.Cname = '';
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/CollectionDocument.cs
export class CollectionDocument extends DocumentBase implements IHasClient {
  Clientid!: number;
  Warehouseid!: number;
  Departmentid!: number;
  OverCollectionMode!: OverCollectionMode;
  OverCollectionQty!: number;
  CashAccountInfoid!: number;
  CashInA!: number;
  BankAccountInfoid!: number;
  BankInA!: number;
  AcceptanceAccountInfoid!: number;
  AcceptanceInA!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.OverCollectionMode === undefined || this.OverCollectionMode === null) {
      this.OverCollectionMode = OverCollectionMode.空值;
    }
    if (this.OverCollectionQty === undefined || this.OverCollectionQty === null) {
      this.OverCollectionQty = 0;
    }
    if (this.CashAccountInfoid === undefined || this.CashAccountInfoid === null) {
      this.CashAccountInfoid = 0;
    }
    if (this.CashInA === undefined || this.CashInA === null) {
      this.CashInA = 0;
    }
    if (this.BankAccountInfoid === undefined || this.BankAccountInfoid === null) {
      this.BankAccountInfoid = 0;
    }
    if (this.BankInA === undefined || this.BankInA === null) {
      this.BankInA = 0;
    }
    if (this.AcceptanceAccountInfoid === undefined || this.AcceptanceAccountInfoid === null) {
      this.AcceptanceAccountInfoid = 0;
    }
    if (this.AcceptanceInA === undefined || this.AcceptanceInA === null) {
      this.AcceptanceInA = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Component/ComponentDemandDocument.cs
export class ComponentDemandDocument extends DocumentBase {
  Departmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/DailyPlanDocument.cs
export class DailyPlanDocument extends DocumentBase {
  Departmentid!: number;
  Equipmentid!: number;
  EquipmentComponentid!: number;
  EquipmentStartTime!: string | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.EquipmentComponentid === undefined || this.EquipmentComponentid === null) {
      this.EquipmentComponentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/DefectiveReworkOrderDocument.cs
export class DefectiveReworkOrderDocument extends DocumentBase implements IInnerKey {
  Materialid!: number;
  Departmentid!: number;
  DutyDepartmentid!: number;
  Employeeid!: number;
  Clientid!: number;
  CheckMethodid!: number;
  DeliveryTime!: string | null;
  RepairTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  InnerKey!: string;
  TypeofWorkid!: number;
  ReworkTypeofWorkid!: number;
  ReworkTypeofWork2id!: number;
  InspectionRequiredStatus!: boolean;
  BringProcessStatus!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.DutyDepartmentid === undefined || this.DutyDepartmentid === null) {
      this.DutyDepartmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.ReworkTypeofWorkid === undefined || this.ReworkTypeofWorkid === null) {
      this.ReworkTypeofWorkid = 0;
    }
    if (this.ReworkTypeofWork2id === undefined || this.ReworkTypeofWork2id === null) {
      this.ReworkTypeofWork2id = 0;
    }
    if (this.InspectionRequiredStatus === undefined || this.InspectionRequiredStatus === null) {
      this.InspectionRequiredStatus = false;
    }
    if (this.BringProcessStatus === undefined || this.BringProcessStatus === null) {
      this.BringProcessStatus = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/DemandAnalysisDocument.cs
export class DemandAnalysisDocument extends DocumentBase {
  Departmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Employee.cs
export class Employee extends GeneralEntityBase implements IScanCode {
  UserName!: string;
  EmployeeNumber!: string;
  Name!: string;
  Gender!: Gender;
  Education!: string;
  IdentityCard!: string;
  Hometown!: string;
  MaritalStatus!: string;
  EthnicGroup!: string;
  MobileNumber!: string;
  Email!: string;
  EmergencyContactName!: string;
  EmergencyContactPhone!: string;
  ResidentialAddress!: string;
  EmployeeState!: string;
  ContractNum!: string;
  HireDate!: string | null;
  ContractStartDate!: string | null;
  ContractEndDate!: string | null;
  CorrectionDate!: string | null;
  ResignationDate!: string | null;
  WayOfLeaving!: string;
  LockerNum!: string;
  WorkshopName!: string;
  BankCard!: string;
  TypeOfInsuranceid!: number | null;
  InsurancePurchaseTime!: string | null;
  InsuranceExpirationTime!: string | null;
  WorkingAge!: number;
  Jobid!: number;
  Departmentid!: number;
  Workshopid!: number | null;
  Note!: string;
  IsOperator!: boolean;
  Password!: string;
  OperatorSetter!: OperatorSetter;
  Privilege!: Privilege;
  BehavioralRoleList!: BehavioralRole[];
  RangeRoleList!: SystemRangeRole[];
  CodeForScan!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.UserName === undefined || this.UserName === null) {
      this.UserName = '';
    }
    if (this.EmployeeNumber === undefined || this.EmployeeNumber === null) {
      this.EmployeeNumber = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Gender === undefined || this.Gender === null) {
      this.Gender = Gender.女 ;
    }
    if (this.Education === undefined || this.Education === null) {
      this.Education = '';
    }
    if (this.IdentityCard === undefined || this.IdentityCard === null) {
      this.IdentityCard = '';
    }
    if (this.Hometown === undefined || this.Hometown === null) {
      this.Hometown = '';
    }
    if (this.MaritalStatus === undefined || this.MaritalStatus === null) {
      this.MaritalStatus = '';
    }
    if (this.EthnicGroup === undefined || this.EthnicGroup === null) {
      this.EthnicGroup = '';
    }
    if (this.MobileNumber === undefined || this.MobileNumber === null) {
      this.MobileNumber = '';
    }
    if (this.Email === undefined || this.Email === null) {
      this.Email = '';
    }
    if (this.EmergencyContactName === undefined || this.EmergencyContactName === null) {
      this.EmergencyContactName = '';
    }
    if (this.EmergencyContactPhone === undefined || this.EmergencyContactPhone === null) {
      this.EmergencyContactPhone = '';
    }
    if (this.ResidentialAddress === undefined || this.ResidentialAddress === null) {
      this.ResidentialAddress = '';
    }
    if (this.EmployeeState === undefined || this.EmployeeState === null) {
      this.EmployeeState = '';
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.WayOfLeaving === undefined || this.WayOfLeaving === null) {
      this.WayOfLeaving = '';
    }
    if (this.LockerNum === undefined || this.LockerNum === null) {
      this.LockerNum = '';
    }
    if (this.WorkshopName === undefined || this.WorkshopName === null) {
      this.WorkshopName = '';
    }
    if (this.BankCard === undefined || this.BankCard === null) {
      this.BankCard = '';
    }
    if (this.WorkingAge === undefined || this.WorkingAge === null) {
      this.WorkingAge = 0;
    }
    if (this.Jobid === undefined || this.Jobid === null) {
      this.Jobid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.IsOperator === undefined || this.IsOperator === null) {
      this.IsOperator = false;
    }
    if (this.Password === undefined || this.Password === null) {
      this.Password = '';
    }
    if (this.OperatorSetter === undefined || this.OperatorSetter === null) {
      this.OperatorSetter = OperatorSetter.IsAdmin ;
    }
    if (this.Privilege === undefined || this.Privilege === null) {
      this.Privilege = Privilege.非审批流人员能直接反审批单据 ;
    }
    if (this.BehavioralRoleList === undefined || this.BehavioralRoleList === null) {
      this.BehavioralRoleList = [];
    }
    if (this.RangeRoleList === undefined || this.RangeRoleList === null) {
      this.RangeRoleList = [];
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/EmployeeJob.cs
export class EmployeeJob extends GeneralEntityBase implements IPause {
  DailyWorkTime!: number;
  Name!: string;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DailyWorkTime === undefined || this.DailyWorkTime === null) {
      this.DailyWorkTime = 0;
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/Equipment.cs
export class Equipment extends GeneralEntityBase implements IEnabled, IPause {
  IsEnabled!: boolean;
  EnabledTime!: string | null;
  EnabledByUserid!: number | null;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  Code!: string;
  Name!: string;
  Dispatcherid!: number;
  TallyClerkid!: number;
  Departmentid!: number;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsEnabled === undefined || this.IsEnabled === null) {
      this.IsEnabled = false;
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Dispatcherid === undefined || this.Dispatcherid === null) {
      this.Dispatcherid = 0;
    }
    if (this.TallyClerkid === undefined || this.TallyClerkid === null) {
      this.TallyClerkid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/HongMao/EquipmentExecutionDetail.cs
export class EquipmentExecutionDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IScanCode, IBringProcess, IInspectionRequired, IUseBom, IUnit, IDUnit, IInnerKey {
  IsUseInspectionRequired!: boolean;
  IsUseBringProcess!: boolean;
  InnerKey!: string;
  Materialid!: number;
  Warehouseid!: number;
  Equipmentid!: number;
  EquipmentComponentid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  ContractNum!: string;
  DeliveryTime!: string | null;
  FurnacePlacement!: FurnacePlacement | null;
  EquipmentStartTime!: string | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseInspectionRequired === undefined || this.IsUseInspectionRequired === null) {
      this.IsUseInspectionRequired = false;
    }
    if (this.IsUseBringProcess === undefined || this.IsUseBringProcess === null) {
      this.IsUseBringProcess = false;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.EquipmentComponentid === undefined || this.EquipmentComponentid === null) {
      this.EquipmentComponentid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/HongMao/EquipmentExecutionDocument.cs
export class EquipmentExecutionDocument extends DocumentBase {
  Departmentid!: number;
  Equipmentid!: number | null;
  EquipmentComponentid!: number;
  EquipmentStartTime!: string | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.EquipmentComponentid === undefined || this.EquipmentComponentid === null) {
      this.EquipmentComponentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Component/ExtrusionPlanDetail.cs
export class ExtrusionPlanDetail extends DetailEntityBase implements IBringProcess, IHasMaterial, IQty, IDQty, IDelivery, IUseBom, IUnit, IDUnit, IInnerKey, IProcessProgress {
  InnerKey!: string;
  IsUseBringProcess!: boolean;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  MinCmpBQty!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  ContractNum!: string;
  DeliveryTime!: string | null;
  VestInid!: number;
  Productionid!: number;
  Equipmentid!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  ProcessTime!: string | null;
  ProcessTypeofWorkid!: number;
  ProcessStatus!: ProcessStatus;
  ProcessQty!: number;
  ProcessStepCount!: number;
  ProcessCurrentStep!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  ProcessSubmitSumQty!: number;
  Document!: ExtrusionPlanDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.IsUseBringProcess === undefined || this.IsUseBringProcess === null) {
      this.IsUseBringProcess = false;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.MinCmpBQty === undefined || this.MinCmpBQty === null) {
      this.MinCmpBQty = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.VestInid === undefined || this.VestInid === null) {
      this.VestInid = 0;
    }
    if (this.Productionid === undefined || this.Productionid === null) {
      this.Productionid = 0;
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.ProcessTypeofWorkid === undefined || this.ProcessTypeofWorkid === null) {
      this.ProcessTypeofWorkid = 0;
    }
    if (this.ProcessStatus === undefined || this.ProcessStatus === null) {
      this.ProcessStatus = ProcessStatus.未开始 ;
    }
    if (this.ProcessQty === undefined || this.ProcessQty === null) {
      this.ProcessQty = 0;
    }
    if (this.ProcessStepCount === undefined || this.ProcessStepCount === null) {
      this.ProcessStepCount = 0;
    }
    if (this.ProcessCurrentStep === undefined || this.ProcessCurrentStep === null) {
      this.ProcessCurrentStep = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.ProcessSubmitSumQty === undefined || this.ProcessSubmitSumQty === null) {
      this.ProcessSubmitSumQty = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new ExtrusionPlanDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Component/ExtrusionPlanDocument.cs
export class ExtrusionPlanDocument extends DocumentBase {
  Departmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/FinalInspectionDetail.cs
export class FinalInspectionDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/FinalInspectionDocument.cs
export class FinalInspectionDocument extends DocumentBase implements IHasClient, IOnlyHasMaterial, IHasEmployee, IInnerKey, IQty, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Employeeid!: number;
  Clientid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckDeliveryTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  Cname!: string;
  InnerKey!: string;
  SeverityLevel!: SeverityLevel;
  TypeofWorkid!: number;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.Cname === undefined || this.Cname === null) {
      this.Cname = '';
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/FirstInspectionDetail.cs
export class FirstInspectionDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/FirstInspectionDocument.cs
export class FirstInspectionDocument extends DocumentBase implements IHasClient, IOnlyHasMaterial, IHasEmployee, IInnerKey, IQty, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Employeeid!: number;
  Clientid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckDeliveryTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  Cname!: string;
  InnerKey!: string;
  SeverityLevel!: SeverityLevel;
  TypeofWorkid!: number;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.Cname === undefined || this.Cname === null) {
      this.Cname = '';
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/HandlingMethod.cs
export class HandlingMethod extends GeneralEntityBase {
  Name!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryCheckDetail.cs
export class InventoryCheckDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IUseBom, IUnit, IDUnit {
  Warehouseid!: number;
  Materialid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  CheckQty!: number;
  CheckDQty!: number;
  DocumentTimeQty!: number;
  DocumentTimeDQty!: number;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  Document!: InventoryCheckDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.CheckQty === undefined || this.CheckQty === null) {
      this.CheckQty = 0;
    }
    if (this.CheckDQty === undefined || this.CheckDQty === null) {
      this.CheckDQty = 0;
    }
    if (this.DocumentTimeQty === undefined || this.DocumentTimeQty === null) {
      this.DocumentTimeQty = 0;
    }
    if (this.DocumentTimeDQty === undefined || this.DocumentTimeDQty === null) {
      this.DocumentTimeDQty = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new InventoryCheckDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryCheckDocument.cs
export class InventoryCheckDocument extends DocumentBase {
  Warehouseid!: number;
  Departmentid!: number;
  CheckByUserid!: number | null;
  Note!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryDirectTransferDetail.cs
export class InventoryDirectTransferDetail extends DetailEntityBase implements IOnlyHasMaterial, IQty, IDQty, IUnit, IDUnit {
  WarehouseInid!: number;
  WarehouseOutid!: number;
  Qty!: number;
  DQty!: number;
  Materialid!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  Document!: InventoryDirectTransferDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.WarehouseInid === undefined || this.WarehouseInid === null) {
      this.WarehouseInid = 0;
    }
    if (this.WarehouseOutid === undefined || this.WarehouseOutid === null) {
      this.WarehouseOutid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new InventoryDirectTransferDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryDirectTransferDocument.cs
export class InventoryDirectTransferDocument extends DocumentBase {
  WarehouseInid!: number;
  WarehouseOutid!: number;
  Departmentid!: number;
  Note!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.WarehouseInid === undefined || this.WarehouseInid === null) {
      this.WarehouseInid = 0;
    }
    if (this.WarehouseOutid === undefined || this.WarehouseOutid === null) {
      this.WarehouseOutid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryFormConvertDetail.cs
export class InventoryFormConvertDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IUseBom, IUnit, IDUnit {
  Warehouseid!: number;
  Materialid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  ChangeType!: ChangeType;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  Document!: InventoryFormConvertDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.ChangeType === undefined || this.ChangeType === null) {
      this.ChangeType = ChangeType.Undefined ;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new InventoryFormConvertDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryFormConvertDocument.cs
export class InventoryFormConvertDocument extends DocumentBase {
  Departmentid!: number;
  Warehouseid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryInfo.cs
export class InventoryInfo extends UniqueEntity {
  Materialid!: number;
  Warehouseid!: number;
  InventoryNum!: number;
  InventoryDNum!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.InventoryNum === undefined || this.InventoryNum === null) {
      this.InventoryNum = 0;
    }
    if (this.InventoryDNum === undefined || this.InventoryDNum === null) {
      this.InventoryDNum = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/InventoryProperty.cs
export class InventoryProperty extends GeneralEntityBase {
  Materialid!: number;
  Warehouseid!: number;
  LowerLimit!: number;
  UpperLimit!: number;
  Note!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.LowerLimit === undefined || this.LowerLimit === null) {
      this.LowerLimit = 0;
    }
    if (this.UpperLimit === undefined || this.UpperLimit === null) {
      this.UpperLimit = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/InventoryRecord.cs
export class InventoryRecord extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IUseBom, IUnit, IDUnit {
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  DocumentType!: string;
  DetailType!: string;
  Detailid!: number;
  IsNoInventory!: boolean;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  BillCode!: string;
  BillDate!: string | null;
  BillApprovalTime!: string | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.DocumentType === undefined || this.DocumentType === null) {
      this.DocumentType = '';
    }
    if (this.DetailType === undefined || this.DetailType === null) {
      this.DetailType = '';
    }
    if (this.Detailid === undefined || this.Detailid === null) {
      this.Detailid = 0;
    }
    if (this.IsNoInventory === undefined || this.IsNoInventory === null) {
      this.IsNoInventory = false;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.BillCode === undefined || this.BillCode === null) {
      this.BillCode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryScrapDetail.cs
export class InventoryScrapDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IUseBom, IUnit, IDUnit {
  Departmentid!: number;
  Warehouseid!: number;
  Materialid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  BelongWorkshopid!: number;
  BelongDepartmentid!: number;
  ScrapType!: ScrapType;
  ScrapReason!: string;
  ScrapApplicationFormStatus!: FormStatus;
  PenaltyFormStatus!: FormStatus;
  Document!: InventoryScrapDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.BelongWorkshopid === undefined || this.BelongWorkshopid === null) {
      this.BelongWorkshopid = 0;
    }
    if (this.BelongDepartmentid === undefined || this.BelongDepartmentid === null) {
      this.BelongDepartmentid = 0;
    }
    if (this.ScrapType === undefined || this.ScrapType === null) {
      this.ScrapType = ScrapType.无责 ;
    }
    if (this.ScrapReason === undefined || this.ScrapReason === null) {
      this.ScrapReason = '';
    }
    if (this.ScrapApplicationFormStatus === undefined || this.ScrapApplicationFormStatus === null) {
      this.ScrapApplicationFormStatus = FormStatus.无 ;
    }
    if (this.PenaltyFormStatus === undefined || this.PenaltyFormStatus === null) {
      this.PenaltyFormStatus = FormStatus.无 ;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new InventoryScrapDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/InventoryScrapDocument.cs
export class InventoryScrapDocument extends DocumentBase {
  Departmentid!: number;
  Warehouseid!: number;
  Note!: string;
  BelongWorkshopid!: number;
  BelongDepartmentid!: number;
  ScrapType!: ScrapType;
  ScrapReason!: string;
  ScrapApplicationFormStatus!: FormStatus;
  PenaltyFormStatus!: FormStatus;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.BelongWorkshopid === undefined || this.BelongWorkshopid === null) {
      this.BelongWorkshopid = 0;
    }
    if (this.BelongDepartmentid === undefined || this.BelongDepartmentid === null) {
      this.BelongDepartmentid = 0;
    }
    if (this.ScrapType === undefined || this.ScrapType === null) {
      this.ScrapType = ScrapType.无责 ;
    }
    if (this.ScrapReason === undefined || this.ScrapReason === null) {
      this.ScrapReason = '';
    }
    if (this.ScrapApplicationFormStatus === undefined || this.ScrapApplicationFormStatus === null) {
      this.ScrapApplicationFormStatus = FormStatus.无 ;
    }
    if (this.PenaltyFormStatus === undefined || this.PenaltyFormStatus === null) {
      this.PenaltyFormStatus = FormStatus.无 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/KPIDetail.cs
export class KPIDetail extends DetailEntityBase implements ICanBeGenerated {
  CreateByDetailid!: number | null;
  CreateByDetailType!: string;
  IsLocked!: number;
  InspectionTime!: string;
  Departmentid!: number;
  Roleid!: number;
  AssessedAccountid!: number;
  CheckItemid!: number;
  BeAssessedAccountid!: number;
  ExpLain!: string;
  Infractions!: number;
  TotalScore!: number;
  Score!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CreateByDetailType === undefined || this.CreateByDetailType === null) {
      this.CreateByDetailType = '';
    }
    if (this.IsLocked === undefined || this.IsLocked === null) {
      this.IsLocked = 0;
    }
    if (this.InspectionTime === undefined || this.InspectionTime === null) {
      this.InspectionTime = '';
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Roleid === undefined || this.Roleid === null) {
      this.Roleid = 0;
    }
    if (this.AssessedAccountid === undefined || this.AssessedAccountid === null) {
      this.AssessedAccountid = 0;
    }
    if (this.CheckItemid === undefined || this.CheckItemid === null) {
      this.CheckItemid = 0;
    }
    if (this.BeAssessedAccountid === undefined || this.BeAssessedAccountid === null) {
      this.BeAssessedAccountid = 0;
    }
    if (this.ExpLain === undefined || this.ExpLain === null) {
      this.ExpLain = '';
    }
    if (this.Infractions === undefined || this.Infractions === null) {
      this.Infractions = 0;
    }
    if (this.TotalScore === undefined || this.TotalScore === null) {
      this.TotalScore = 0;
    }
    if (this.Score === undefined || this.Score === null) {
      this.Score = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/KPIDocument.cs
export class KPIDocument extends GeneralEntityBase implements ICode {
  Code!: string;
  IsLocked!: number;
  Departmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.IsLocked === undefined || this.IsLocked === null) {
      this.IsLocked = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/KPIExamSubject.cs
export class KPIExamSubject extends GeneralEntityBase {
  Name!: string;
  ContentText!: string;
  Score!: number;
  Departmentid!: number;
  Roleid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.ContentText === undefined || this.ContentText === null) {
      this.ContentText = '';
    }
    if (this.Score === undefined || this.Score === null) {
      this.Score = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Roleid === undefined || this.Roleid === null) {
      this.Roleid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/Level.cs
export class Level extends EntityBase {
  Name!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/LinkmanBase.cs
export class LinkmanBase extends GeneralEntityBase {
  Name!: string;
  MobilePhoneNumber!: string;
  TelephoneNumber!: string;
  Fax!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.MobilePhoneNumber === undefined || this.MobilePhoneNumber === null) {
      this.MobilePhoneNumber = '';
    }
    if (this.TelephoneNumber === undefined || this.TelephoneNumber === null) {
      this.TelephoneNumber = '';
    }
    if (this.Fax === undefined || this.Fax === null) {
      this.Fax = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ClientLinkman.cs
export class ClientLinkman extends LinkmanBase implements IHasClient {
  Clientid!: number;
  Client!: Client;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Client === undefined || this.Client === null) {
      this.Client = new Client();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Material.cs
export class Material extends GeneralEntityBase implements IMaterial, IMaterialCustomProperty, IHasClient {
  EnabledTime!: string | null;
  EnabledByUserid!: number | null;
  IsEnabled!: boolean;
  Code!: string;
  Name!: string;
  Clientid!: number;
  Warehouseid!: number;
  MaterialTypeid!: number;
  SpecType!: string;
  SpecTypeExplain!: string;
  ClientMaterialDesc!: string;
  ClientMaterialCode!: string;
  MaterialPropertyid!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  DeputyConversionRate!: number;
  PushBackMode!: PushBackMode;
  Note!: string;
  PackedQuantity!: number;
  BoxedQuantity!: number;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  IsNoInventory!: boolean;
  DefaultQuantity!: number;
  BringProcess!: BringProcess;
  InspectionRequired!: InspectionRequired;
  PackConfig!: PackConfig;
  CheckCaseDocumentid!: number;
  CheckMethodid!: number;
  LegrandCode!: string;
  PurchaseExceedRate!: number;
  ProduceExceedRate!: number;
  CertificateLogo!: string;
  PurchaseDays!: number;
  ResponsibleWorkshopid!: number;
  CaiZhi!: string;
  GongXuMingCheng!: string;
  LiangDuanBoPiChiCun!: string;
  LiangDuanHanDianChangDu!: string;
  LiangDuanHanDianHouDu!: string;
  HanDianKuanDuXingZhuang!: string;
  JiShuBianMa!: string;
  NeiMoChiCun!: string;
  WaiMoChiCun!: string;
  ChengPinXianFanWei!: string;
  JueYuanCengHouDuGongCha!: string;
  FuZhuoLi!: string;
  SheDingZhenKongFuYa!: string;
  XianSu!: string;
  YinZiYaoQiu!: string;
  PingFangShu!: string;
  TuHao!: string;
  TongCaiPiHao!: string;
  SuLiaoPiHao!: string;
  ChintDesc!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsEnabled === undefined || this.IsEnabled === null) {
      this.IsEnabled = false;
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.MaterialTypeid === undefined || this.MaterialTypeid === null) {
      this.MaterialTypeid = 0;
    }
    if (this.SpecType === undefined || this.SpecType === null) {
      this.SpecType = '';
    }
    if (this.SpecTypeExplain === undefined || this.SpecTypeExplain === null) {
      this.SpecTypeExplain = '';
    }
    if (this.ClientMaterialDesc === undefined || this.ClientMaterialDesc === null) {
      this.ClientMaterialDesc = '';
    }
    if (this.ClientMaterialCode === undefined || this.ClientMaterialCode === null) {
      this.ClientMaterialCode = '';
    }
    if (this.MaterialPropertyid === undefined || this.MaterialPropertyid === null) {
      this.MaterialPropertyid = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.PackedQuantity === undefined || this.PackedQuantity === null) {
      this.PackedQuantity = 0;
    }
    if (this.BoxedQuantity === undefined || this.BoxedQuantity === null) {
      this.BoxedQuantity = 0;
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
    if (this.IsNoInventory === undefined || this.IsNoInventory === null) {
      this.IsNoInventory = false;
    }
    if (this.DefaultQuantity === undefined || this.DefaultQuantity === null) {
      this.DefaultQuantity = 0;
    }
    if (this.BringProcess === undefined || this.BringProcess === null) {
      this.BringProcess = BringProcess.组装完工单带工艺 ;
    }
    if (this.InspectionRequired === undefined || this.InspectionRequired === null) {
      this.InspectionRequired = InspectionRequired.采购收货检验 ;
    }
    if (this.PackConfig === undefined || this.PackConfig === null) {
      this.PackConfig = PackConfig.是装盒物料 ;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.LegrandCode === undefined || this.LegrandCode === null) {
      this.LegrandCode = '';
    }
    if (this.PurchaseExceedRate === undefined || this.PurchaseExceedRate === null) {
      this.PurchaseExceedRate = 0;
    }
    if (this.ProduceExceedRate === undefined || this.ProduceExceedRate === null) {
      this.ProduceExceedRate = 0;
    }
    if (this.CertificateLogo === undefined || this.CertificateLogo === null) {
      this.CertificateLogo = '';
    }
    if (this.PurchaseDays === undefined || this.PurchaseDays === null) {
      this.PurchaseDays = 0;
    }
    if (this.ResponsibleWorkshopid === undefined || this.ResponsibleWorkshopid === null) {
      this.ResponsibleWorkshopid = 0;
    }
    if (this.CaiZhi === undefined || this.CaiZhi === null) {
      this.CaiZhi = '';
    }
    if (this.GongXuMingCheng === undefined || this.GongXuMingCheng === null) {
      this.GongXuMingCheng = '';
    }
    if (this.LiangDuanBoPiChiCun === undefined || this.LiangDuanBoPiChiCun === null) {
      this.LiangDuanBoPiChiCun = '';
    }
    if (this.LiangDuanHanDianChangDu === undefined || this.LiangDuanHanDianChangDu === null) {
      this.LiangDuanHanDianChangDu = '';
    }
    if (this.LiangDuanHanDianHouDu === undefined || this.LiangDuanHanDianHouDu === null) {
      this.LiangDuanHanDianHouDu = '';
    }
    if (this.HanDianKuanDuXingZhuang === undefined || this.HanDianKuanDuXingZhuang === null) {
      this.HanDianKuanDuXingZhuang = '';
    }
    if (this.JiShuBianMa === undefined || this.JiShuBianMa === null) {
      this.JiShuBianMa = '';
    }
    if (this.NeiMoChiCun === undefined || this.NeiMoChiCun === null) {
      this.NeiMoChiCun = '';
    }
    if (this.WaiMoChiCun === undefined || this.WaiMoChiCun === null) {
      this.WaiMoChiCun = '';
    }
    if (this.ChengPinXianFanWei === undefined || this.ChengPinXianFanWei === null) {
      this.ChengPinXianFanWei = '';
    }
    if (this.JueYuanCengHouDuGongCha === undefined || this.JueYuanCengHouDuGongCha === null) {
      this.JueYuanCengHouDuGongCha = '';
    }
    if (this.FuZhuoLi === undefined || this.FuZhuoLi === null) {
      this.FuZhuoLi = '';
    }
    if (this.SheDingZhenKongFuYa === undefined || this.SheDingZhenKongFuYa === null) {
      this.SheDingZhenKongFuYa = '';
    }
    if (this.XianSu === undefined || this.XianSu === null) {
      this.XianSu = '';
    }
    if (this.YinZiYaoQiu === undefined || this.YinZiYaoQiu === null) {
      this.YinZiYaoQiu = '';
    }
    if (this.PingFangShu === undefined || this.PingFangShu === null) {
      this.PingFangShu = '';
    }
    if (this.TuHao === undefined || this.TuHao === null) {
      this.TuHao = '';
    }
    if (this.TongCaiPiHao === undefined || this.TongCaiPiHao === null) {
      this.TongCaiPiHao = '';
    }
    if (this.SuLiaoPiHao === undefined || this.SuLiaoPiHao === null) {
      this.SuLiaoPiHao = '';
    }
    if (this.ChintDesc === undefined || this.ChintDesc === null) {
      this.ChintDesc = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialCheckCase.cs
export class MaterialCheckCase extends GeneralEntityBase {
  Materialid!: number;
  CheckCaseDocumentid!: number;
  CheckMethodid!: number;
  SeverityLevel!: SeverityLevel;
  CaseType!: MaterialCheckCaseType;
  BelongTypeofWorkid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.CaseType === undefined || this.CaseType === null) {
      this.CaseType = MaterialCheckCaseType.IncomingInspection ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialCheckCaseDetail.cs
export class MaterialCheckCaseDetail extends ChildEntityBase implements ICheckCaseDetail {
  Materialid!: number;
  BelongTypeofWorkid!: number | null;
  ProjectName!: string;
  Frequency!: string;
  Method!: string;
  Content!: string;
  DownQValue!: string;
  UpQValue!: string;
  AQL!: string;
  ACRE!: string;
  CmpQValue!: string;
  KeepDecimal!: string;
  Value1!: string;
  Value2!: string;
  Value3!: string;
  Value4!: string;
  Value5!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
    if (this.KeepDecimal === undefined || this.KeepDecimal === null) {
      this.KeepDecimal = '';
    }
    if (this.Value1 === undefined || this.Value1 === null) {
      this.Value1 = '';
    }
    if (this.Value2 === undefined || this.Value2 === null) {
      this.Value2 = '';
    }
    if (this.Value3 === undefined || this.Value3 === null) {
      this.Value3 = '';
    }
    if (this.Value4 === undefined || this.Value4 === null) {
      this.Value4 = '';
    }
    if (this.Value5 === undefined || this.Value5 === null) {
      this.Value5 = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/MaterialFile.cs
export class MaterialFile extends GeneralEntityBase implements IFile {
  Materialid!: number;
  EnumKey!: MaterialFieldType;
  CloudFileid!: number;
  FileName!: string;
  Suffix!: string;
  FileDescription!: string;
  Bytes!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.EnumKey === undefined || this.EnumKey === null) {
      this.EnumKey = MaterialFieldType.物料概览图 ;
    }
    if (this.CloudFileid === undefined || this.CloudFileid === null) {
      this.CloudFileid = 0;
    }
    if (this.FileName === undefined || this.FileName === null) {
      this.FileName = '';
    }
    if (this.Suffix === undefined || this.Suffix === null) {
      this.Suffix = '';
    }
    if (this.FileDescription === undefined || this.FileDescription === null) {
      this.FileDescription = '';
    }
    if (this.Bytes === undefined || this.Bytes === null) {
      this.Bytes = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialModifyDetail.cs
export class MaterialModifyDetail extends DetailEntityBase implements IUniversalModifyDetail, IMaterial, IMaterialCustomProperty, IHasClient {
  Targetid!: number;
  ChangeTimeType!: ChangeTimeType;
  PairKey!: number;
  EnabledTime!: string | null;
  EnabledByUserid!: number | null;
  IsEnabled!: boolean;
  Code!: string;
  Name!: string;
  Clientid!: number;
  Warehouseid!: number;
  MaterialTypeid!: number;
  SpecType!: string;
  SpecTypeExplain!: string;
  ClientMaterialCode!: string;
  ClientMaterialDesc!: string;
  MaterialPropertyid!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  DeputyConversionRate!: number;
  PushBackMode!: PushBackMode;
  Note!: string;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  IsNoInventory!: boolean;
  DefaultQuantity!: number;
  PackedQuantity!: number;
  BringProcess!: BringProcess;
  InspectionRequired!: InspectionRequired;
  CheckCaseDocumentid!: number;
  CheckMethodid!: number;
  LegrandCode!: string;
  CertificateLogo!: string;
  PurchaseDays!: number;
  ResponsibleWorkshopid!: number;
  CaiZhi!: string;
  GongXuMingCheng!: string;
  LiangDuanBoPiChiCun!: string;
  LiangDuanHanDianChangDu!: string;
  LiangDuanHanDianHouDu!: string;
  HanDianKuanDuXingZhuang!: string;
  JiShuBianMa!: string;
  NeiMoChiCun!: string;
  WaiMoChiCun!: string;
  ChengPinXianFanWei!: string;
  JueYuanCengHouDuGongCha!: string;
  FuZhuoLi!: string;
  SheDingZhenKongFuYa!: string;
  XianSu!: string;
  YinZiYaoQiu!: string;
  PingFangShu!: string;
  TuHao!: string;
  TongCaiPiHao!: string;
  SuLiaoPiHao!: string;
  ChintDesc!: string;
  SeverityLevel!: SeverityLevel;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Targetid === undefined || this.Targetid === null) {
      this.Targetid = 0;
    }
    if (this.ChangeTimeType === undefined || this.ChangeTimeType === null) {
      this.ChangeTimeType = ChangeTimeType.None;
    }
    if (this.PairKey === undefined || this.PairKey === null) {
      this.PairKey = 0;
    }
    if (this.IsEnabled === undefined || this.IsEnabled === null) {
      this.IsEnabled = false;
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.MaterialTypeid === undefined || this.MaterialTypeid === null) {
      this.MaterialTypeid = 0;
    }
    if (this.SpecType === undefined || this.SpecType === null) {
      this.SpecType = '';
    }
    if (this.SpecTypeExplain === undefined || this.SpecTypeExplain === null) {
      this.SpecTypeExplain = '';
    }
    if (this.ClientMaterialCode === undefined || this.ClientMaterialCode === null) {
      this.ClientMaterialCode = '';
    }
    if (this.ClientMaterialDesc === undefined || this.ClientMaterialDesc === null) {
      this.ClientMaterialDesc = '';
    }
    if (this.MaterialPropertyid === undefined || this.MaterialPropertyid === null) {
      this.MaterialPropertyid = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
    if (this.IsNoInventory === undefined || this.IsNoInventory === null) {
      this.IsNoInventory = false;
    }
    if (this.DefaultQuantity === undefined || this.DefaultQuantity === null) {
      this.DefaultQuantity = 0;
    }
    if (this.PackedQuantity === undefined || this.PackedQuantity === null) {
      this.PackedQuantity = 0;
    }
    if (this.BringProcess === undefined || this.BringProcess === null) {
      this.BringProcess = BringProcess.组装完工单带工艺 ;
    }
    if (this.InspectionRequired === undefined || this.InspectionRequired === null) {
      this.InspectionRequired = InspectionRequired.采购收货检验 ;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.LegrandCode === undefined || this.LegrandCode === null) {
      this.LegrandCode = '';
    }
    if (this.CertificateLogo === undefined || this.CertificateLogo === null) {
      this.CertificateLogo = '';
    }
    if (this.PurchaseDays === undefined || this.PurchaseDays === null) {
      this.PurchaseDays = 0;
    }
    if (this.ResponsibleWorkshopid === undefined || this.ResponsibleWorkshopid === null) {
      this.ResponsibleWorkshopid = 0;
    }
    if (this.CaiZhi === undefined || this.CaiZhi === null) {
      this.CaiZhi = '';
    }
    if (this.GongXuMingCheng === undefined || this.GongXuMingCheng === null) {
      this.GongXuMingCheng = '';
    }
    if (this.LiangDuanBoPiChiCun === undefined || this.LiangDuanBoPiChiCun === null) {
      this.LiangDuanBoPiChiCun = '';
    }
    if (this.LiangDuanHanDianChangDu === undefined || this.LiangDuanHanDianChangDu === null) {
      this.LiangDuanHanDianChangDu = '';
    }
    if (this.LiangDuanHanDianHouDu === undefined || this.LiangDuanHanDianHouDu === null) {
      this.LiangDuanHanDianHouDu = '';
    }
    if (this.HanDianKuanDuXingZhuang === undefined || this.HanDianKuanDuXingZhuang === null) {
      this.HanDianKuanDuXingZhuang = '';
    }
    if (this.JiShuBianMa === undefined || this.JiShuBianMa === null) {
      this.JiShuBianMa = '';
    }
    if (this.NeiMoChiCun === undefined || this.NeiMoChiCun === null) {
      this.NeiMoChiCun = '';
    }
    if (this.WaiMoChiCun === undefined || this.WaiMoChiCun === null) {
      this.WaiMoChiCun = '';
    }
    if (this.ChengPinXianFanWei === undefined || this.ChengPinXianFanWei === null) {
      this.ChengPinXianFanWei = '';
    }
    if (this.JueYuanCengHouDuGongCha === undefined || this.JueYuanCengHouDuGongCha === null) {
      this.JueYuanCengHouDuGongCha = '';
    }
    if (this.FuZhuoLi === undefined || this.FuZhuoLi === null) {
      this.FuZhuoLi = '';
    }
    if (this.SheDingZhenKongFuYa === undefined || this.SheDingZhenKongFuYa === null) {
      this.SheDingZhenKongFuYa = '';
    }
    if (this.XianSu === undefined || this.XianSu === null) {
      this.XianSu = '';
    }
    if (this.YinZiYaoQiu === undefined || this.YinZiYaoQiu === null) {
      this.YinZiYaoQiu = '';
    }
    if (this.PingFangShu === undefined || this.PingFangShu === null) {
      this.PingFangShu = '';
    }
    if (this.TuHao === undefined || this.TuHao === null) {
      this.TuHao = '';
    }
    if (this.TongCaiPiHao === undefined || this.TongCaiPiHao === null) {
      this.TongCaiPiHao = '';
    }
    if (this.SuLiaoPiHao === undefined || this.SuLiaoPiHao === null) {
      this.SuLiaoPiHao = '';
    }
    if (this.ChintDesc === undefined || this.ChintDesc === null) {
      this.ChintDesc = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialModifyDocument.cs
export class MaterialModifyDocument extends DocumentBase implements IUniversalModifyDocument {
  Departmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialProperty.cs
export class MaterialProperty extends GeneralEntityBase implements ICode, IPause {
  Code!: string;
  Name!: string;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialStockOutCheckCase.cs
export class MaterialStockOutCheckCase extends GeneralEntityBase {
  Materialid!: number;
  CheckCaseDocumentid!: number;
  CheckMethodid!: number;
  SeverityLevel!: SeverityLevel;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialStockOutCheckCaseDetail.cs
export class MaterialStockOutCheckCaseDetail extends ChildEntityBase implements ICheckCaseDetail {
  ProjectName!: string;
  Frequency!: string;
  Method!: string;
  Content!: string;
  DownQValue!: string;
  UpQValue!: string;
  AQL!: string;
  ACRE!: string;
  CmpQValue!: string;
  KeepDecimal!: string;
  Value1!: string;
  Value2!: string;
  Value3!: string;
  Value4!: string;
  Value5!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
    if (this.KeepDecimal === undefined || this.KeepDecimal === null) {
      this.KeepDecimal = '';
    }
    if (this.Value1 === undefined || this.Value1 === null) {
      this.Value1 = '';
    }
    if (this.Value2 === undefined || this.Value2 === null) {
      this.Value2 = '';
    }
    if (this.Value3 === undefined || this.Value3 === null) {
      this.Value3 = '';
    }
    if (this.Value4 === undefined || this.Value4 === null) {
      this.Value4 = '';
    }
    if (this.Value5 === undefined || this.Value5 === null) {
      this.Value5 = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialType.cs
export class MaterialType extends GeneralEntityBase implements ICode, IPause {
  Code!: string;
  Name!: string;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/MaterialUnit.cs
export class MaterialUnit extends GeneralEntityBase {
  Name!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/MaxProgramDetail.cs
export class MaxProgramDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IUseBom, IUnit, IDUnit {
  Materialid!: number;
  Warehouseid!: number;
  Equipmentid!: number;
  Dispatcherid!: number;
  TallyClerkid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  ContractNum!: string;
  DeliveryTime!: string | null;
  MinCmpBQty!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  Document!: MaxProgramDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.Dispatcherid === undefined || this.Dispatcherid === null) {
      this.Dispatcherid = 0;
    }
    if (this.TallyClerkid === undefined || this.TallyClerkid === null) {
      this.TallyClerkid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.MinCmpBQty === undefined || this.MinCmpBQty === null) {
      this.MinCmpBQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new MaxProgramDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/MaxProgramDocument.cs
export class MaxProgramDocument extends DocumentBase {
  Departmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/NavigationMenu.cs
export class NavigationMenu extends GeneralEntityBase {
  Name!: string;
  GeometryName!: string;
  PageTypeName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.GeometryName === undefined || this.GeometryName === null) {
      this.GeometryName = '';
    }
    if (this.PageTypeName === undefined || this.PageTypeName === null) {
      this.PageTypeName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/OperatorLinkBehavioralRole.cs
export class OperatorLinkBehavioralRole extends UniqueEntity {
  Operatorid!: number;
  BehavioralRoleid!: number;
  Operator!: Employee;
  BehavioralRole!: BehavioralRole;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Operatorid === undefined || this.Operatorid === null) {
      this.Operatorid = 0;
    }
    if (this.BehavioralRoleid === undefined || this.BehavioralRoleid === null) {
      this.BehavioralRoleid = 0;
    }
    if (this.Operator === undefined || this.Operator === null) {
      this.Operator = new Employee();
    }
    if (this.BehavioralRole === undefined || this.BehavioralRole === null) {
      this.BehavioralRole = new BehavioralRole();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/OperatorLinkFieldRole.cs
export class OperatorLinkFieldRole extends UniqueEntity {
  Operatorid!: number;
  FieldRoleid!: number;
  Operator!: Employee;
  SystemFieldRole!: SystemFieldRole;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Operatorid === undefined || this.Operatorid === null) {
      this.Operatorid = 0;
    }
    if (this.FieldRoleid === undefined || this.FieldRoleid === null) {
      this.FieldRoleid = 0;
    }
    if (this.Operator === undefined || this.Operator === null) {
      this.Operator = new Employee();
    }
    if (this.SystemFieldRole === undefined || this.SystemFieldRole === null) {
      this.SystemFieldRole = new SystemFieldRole();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/OperatorLinkRangeRole.cs
export class OperatorLinkRangeRole extends UniqueEntity {
  Operatorid!: number;
  RangeRoleid!: number;
  Operator!: Employee;
  SystemRangeRole!: SystemRangeRole;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Operatorid === undefined || this.Operatorid === null) {
      this.Operatorid = 0;
    }
    if (this.RangeRoleid === undefined || this.RangeRoleid === null) {
      this.RangeRoleid = 0;
    }
    if (this.Operator === undefined || this.Operator === null) {
      this.Operator = new Employee();
    }
    if (this.SystemRangeRole === undefined || this.SystemRangeRole === null) {
      this.SystemRangeRole = new SystemRangeRole();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/OtherCollectDetail.cs
export class OtherCollectDetail extends DetailEntityBase implements IQty, IHasMoney {
  DebtItemid!: number;
  Qty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  Note!: any;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DebtItemid === undefined || this.DebtItemid === null) {
      this.DebtItemid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/OtherCollectDocument.cs
export class OtherCollectDocument extends DocumentBase implements IHasMoneyDocument, IHasClient, IHasTax {
  Clientid!: number;
  Departmentid!: number;
  TaxMode!: string;
  TaxRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/OtherDetail.cs
export class OtherDetail extends DetailEntityBase implements ICanBeGenerated, IHasMaterial, IQty, IDQty, IUseBom, IUnit, IDUnit {
  CreateByDetailid!: number | null;
  CreateByDetailType!: string;
  Warehouseid!: number;
  Materialid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.CreateByDetailType === undefined || this.CreateByDetailType === null) {
      this.CreateByDetailType = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/OtherDocument.cs
export class OtherDocument extends DocumentBase implements IHasTax {
  VestInid!: number;
  Departmentid!: number;
  TaxMode!: string;
  TaxRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.VestInid === undefined || this.VestInid === null) {
      this.VestInid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/OtherInDetail.cs
export class OtherInDetail extends OtherDetail {
  Material!: Material;
  Warehouse!: Warehouse;
  Document!: OtherInDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Material === undefined || this.Material === null) {
      this.Material = new Material();
    }
    if (this.Warehouse === undefined || this.Warehouse === null) {
      this.Warehouse = new Warehouse();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new OtherInDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/OtherInDocument.cs
export class OtherInDocument extends OtherDocument {
  Department!: Department;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Department === undefined || this.Department === null) {
      this.Department = new Department();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/OtherOutDetail.cs
export class OtherOutDetail extends OtherDetail {
  Material!: Material;
  Warehouse!: Warehouse;
  Document!: OtherOutDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Material === undefined || this.Material === null) {
      this.Material = new Material();
    }
    if (this.Warehouse === undefined || this.Warehouse === null) {
      this.Warehouse = new Warehouse();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new OtherOutDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Inventory/OtherOutDocument.cs
export class OtherOutDocument extends OtherDocument {
  Department!: Department;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Department === undefined || this.Department === null) {
      this.Department = new Department();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AP/OtherPayDetail.cs
export class OtherPayDetail extends DetailEntityBase implements IQty {
  DebtItemid!: number;
  Qty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  Note!: any;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DebtItemid === undefined || this.DebtItemid === null) {
      this.DebtItemid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AP/OtherPayDocument.cs
export class OtherPayDocument extends DocumentBase implements IHasMoneyDocument, IHasSupplier, IHasTax {
  Supplierid!: number;
  Departmentid!: number;
  TaxMode!: string;
  TaxRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Detail/OutsourcedCompletionDetail.cs
export class OutsourcedCompletionDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Document/OutsourcedCompletionDocument.cs
export class OutsourcedCompletionDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasTax, IHasSupplier {
  Supplierid!: number;
  PurchaseDepartmentid!: number;
  SalesManid!: number;
  TaxMode!: string;
  Warehouseid!: number;
  TaxRate!: number;
  DeliveryTime!: string | null;
  Note!: string;
  TransportMode!: string;
  PaymentMode!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchaseDepartmentid === undefined || this.PurchaseDepartmentid === null) {
      this.PurchaseDepartmentid = 0;
    }
    if (this.SalesManid === undefined || this.SalesManid === null) {
      this.SalesManid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/OutSourceDetail.cs
export class OutSourceDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IUseBom, IUnit, IDUnit {
  Warehouseid!: number;
  Materialid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  DUnitPrice!: number;
  ProcessingUnitPrice!: number;
  ProcessingCharge!: number;
  JiaShuiJinE!: number;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.DUnitPrice === undefined || this.DUnitPrice === null) {
      this.DUnitPrice = 0;
    }
    if (this.ProcessingUnitPrice === undefined || this.ProcessingUnitPrice === null) {
      this.ProcessingUnitPrice = 0;
    }
    if (this.ProcessingCharge === undefined || this.ProcessingCharge === null) {
      this.ProcessingCharge = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/OutSourceDocument.cs
export class OutSourceDocument extends DocumentBase implements IHasTax {
  Fabricatorsid!: number;
  Departmentid!: number;
  TaxMode!: string;
  TaxRate!: number;
  VirtualWarehouseid!: number;
  Status!: DocumentStatus;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Fabricatorsid === undefined || this.Fabricatorsid === null) {
      this.Fabricatorsid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.VirtualWarehouseid === undefined || this.VirtualWarehouseid === null) {
      this.VirtualWarehouseid = 0;
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = DocumentStatus.未审批 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Detail/OutsourcedReceivingDetail.cs
export class OutsourcedReceivingDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Document/OutsourcedReceivingDocument.cs
export class OutsourcedReceivingDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasTax, IHasSupplier {
  Supplierid!: number;
  PurchaseDepartmentid!: number;
  SalesManid!: number;
  TaxMode!: string;
  Warehouseid!: number;
  TaxRate!: number;
  DeliveryTime!: string | null;
  Note!: string;
  TransportMode!: string;
  PaymentMode!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchaseDepartmentid === undefined || this.PurchaseDepartmentid === null) {
      this.PurchaseDepartmentid = 0;
    }
    if (this.SalesManid === undefined || this.SalesManid === null) {
      this.SalesManid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Detail/OutsourcedReturnDetail.cs
export class OutsourcedReturnDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Document/OutsourcedReturnDocument.cs
export class OutsourcedReturnDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasTax, IHasSupplier {
  Supplierid!: number;
  PurchaseDepartmentid!: number;
  SalesManid!: number;
  TaxMode!: string;
  Warehouseid!: number;
  TaxRate!: number;
  DeliveryTime!: string | null;
  Note!: string;
  TransportMode!: string;
  PaymentMode!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchaseDepartmentid === undefined || this.PurchaseDepartmentid === null) {
      this.PurchaseDepartmentid = 0;
    }
    if (this.SalesManid === undefined || this.SalesManid === null) {
      this.SalesManid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Detail/OutsourcedReturnFormDetail.cs
export class OutsourcedReturnFormDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Document/OutsourcedReturnFormDocument.cs
export class OutsourcedReturnFormDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasTax, IHasSupplier {
  Supplierid!: number;
  PurchaseDepartmentid!: number;
  SalesManid!: number;
  TaxMode!: string;
  Warehouseid!: number;
  TaxRate!: number;
  DeliveryTime!: string | null;
  Note!: string;
  TransportMode!: string;
  PaymentMode!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchaseDepartmentid === undefined || this.PurchaseDepartmentid === null) {
      this.PurchaseDepartmentid = 0;
    }
    if (this.SalesManid === undefined || this.SalesManid === null) {
      this.SalesManid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Detail/OutsourcedReturnNoticeDetail.cs
export class OutsourcedReturnNoticeDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Document/OutsourcedReturnNoticeDocument.cs
export class OutsourcedReturnNoticeDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasTax, IHasSupplier {
  Supplierid!: number;
  PurchaseDepartmentid!: number;
  SalesManid!: number;
  TaxMode!: string;
  Warehouseid!: number;
  TaxRate!: number;
  DeliveryTime!: string | null;
  Note!: string;
  TransportMode!: string;
  PaymentMode!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchaseDepartmentid === undefined || this.PurchaseDepartmentid === null) {
      this.PurchaseDepartmentid = 0;
    }
    if (this.SalesManid === undefined || this.SalesManid === null) {
      this.SalesManid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Detail/OutsourcingOrderDetail.cs
export class OutsourcingOrderDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Outsourced/Document/OutsourcingOrderDocument.cs
export class OutsourcingOrderDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasTax, IHasSupplier {
  Supplierid!: number;
  PurchaseDepartmentid!: number;
  SalesManid!: number;
  TaxMode!: string;
  Warehouseid!: number;
  TaxRate!: number;
  DeliveryTime!: string | null;
  Note!: string;
  TransportMode!: string;
  PaymentMode!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchaseDepartmentid === undefined || this.PurchaseDepartmentid === null) {
      this.PurchaseDepartmentid = 0;
    }
    if (this.SalesManid === undefined || this.SalesManid === null) {
      this.SalesManid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/Partner.cs
export class Partner extends GeneralEntityBase implements IEnabled, IPartner, IPause {
  EnabledTime!: string | null;
  EnabledByUserid!: number | null;
  IsEnabled!: boolean;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  Code!: string;
  Name!: string;
  ShortName!: string;
  ContractNum!: string;
  MainLinkmanid!: number;
  EmergencyLinkmanid!: number;
  ProofDay!: number | null;
  TransportMode!: string;
  TaxMode!: string;
  PaymentMode!: string;
  TaxRate!: number | null;
  NameOfVATCompany!: string;
  VATTelephone!: string;
  VATBankAddress!: string;
  BankAccount!: string;
  Address!: string;
  Email!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsEnabled === undefined || this.IsEnabled === null) {
      this.IsEnabled = false;
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.ShortName === undefined || this.ShortName === null) {
      this.ShortName = '';
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.MainLinkmanid === undefined || this.MainLinkmanid === null) {
      this.MainLinkmanid = 0;
    }
    if (this.EmergencyLinkmanid === undefined || this.EmergencyLinkmanid === null) {
      this.EmergencyLinkmanid = 0;
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
    if (this.NameOfVATCompany === undefined || this.NameOfVATCompany === null) {
      this.NameOfVATCompany = '';
    }
    if (this.VATTelephone === undefined || this.VATTelephone === null) {
      this.VATTelephone = '';
    }
    if (this.VATBankAddress === undefined || this.VATBankAddress === null) {
      this.VATBankAddress = '';
    }
    if (this.BankAccount === undefined || this.BankAccount === null) {
      this.BankAccount = '';
    }
    if (this.Address === undefined || this.Address === null) {
      this.Address = '';
    }
    if (this.Email === undefined || this.Email === null) {
      this.Email = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Client.cs
export class Client extends Partner {
  BelongSalesPersonid!: number | null;
  BelongDepartmentid!: number | null;
  AssistantEngineer!: number | null;
  ProjectLeader!: number | null;
  ProjectManager!: number | null;
  BusinessOwnerid!: number;
  CreditControlMode!: string;
  DQZKED!: number | null;
  CreditTermMode!: string;
  CreditPeriod!: number;
  Label!: string;
  PackagingRequirement!: string;
  DocumentRequirement!: string;
  DetailRequirement!: string;
  SpecialNeeds!: ClientSpecialNeeds;
  MainLinkmanid!: any;
  WrittenOffNotReceived!: number;
  WrittenOffNotReceivedBeforeTheCreditPeriod!: number;
  WrittenOffNotReceivedBeforeTheCreditPeriodBufferPeriod!: number;
  ClientLinkmanList!: ClientLinkman[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BusinessOwnerid === undefined || this.BusinessOwnerid === null) {
      this.BusinessOwnerid = 0;
    }
    if (this.CreditControlMode === undefined || this.CreditControlMode === null) {
      this.CreditControlMode = '';
    }
    if (this.CreditTermMode === undefined || this.CreditTermMode === null) {
      this.CreditTermMode = '';
    }
    if (this.CreditPeriod === undefined || this.CreditPeriod === null) {
      this.CreditPeriod = 0;
    }
    if (this.Label === undefined || this.Label === null) {
      this.Label = '';
    }
    if (this.PackagingRequirement === undefined || this.PackagingRequirement === null) {
      this.PackagingRequirement = '';
    }
    if (this.DocumentRequirement === undefined || this.DocumentRequirement === null) {
      this.DocumentRequirement = '';
    }
    if (this.DetailRequirement === undefined || this.DetailRequirement === null) {
      this.DetailRequirement = '';
    }
    if (this.SpecialNeeds === undefined || this.SpecialNeeds === null) {
      this.SpecialNeeds = ClientSpecialNeeds.需装箱_追溯 ;
    }
    if (this.WrittenOffNotReceived === undefined || this.WrittenOffNotReceived === null) {
      this.WrittenOffNotReceived = 0;
    }
    if (this.WrittenOffNotReceivedBeforeTheCreditPeriod === undefined || this.WrittenOffNotReceivedBeforeTheCreditPeriod === null) {
      this.WrittenOffNotReceivedBeforeTheCreditPeriod = 0;
    }
    if (this.WrittenOffNotReceivedBeforeTheCreditPeriodBufferPeriod === undefined || this.WrittenOffNotReceivedBeforeTheCreditPeriodBufferPeriod === null) {
      this.WrittenOffNotReceivedBeforeTheCreditPeriodBufferPeriod = 0;
    }
    if (this.ClientLinkmanList === undefined || this.ClientLinkmanList === null) {
      this.ClientLinkmanList = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AP/PaymentDetail.cs
export class PaymentDetail extends DetailEntityBase {
  Receivables!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Receivables === undefined || this.Receivables === null) {
      this.Receivables = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AP/PaymentDocument.cs
export class PaymentDocument extends DocumentBase implements IHasSupplier {
  Supplierid!: number;
  Warehouseid!: number;
  Departmentid!: number;
  OverpaymentMode!: OverpaymentMode;
  OverpaymentQty!: number;
  CashAccountInfoid!: number;
  CashInA!: number;
  BankAccountInfoid!: number;
  BankInA!: number;
  AcceptanceAccountInfoid!: number;
  AcceptanceInA!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.OverpaymentMode === undefined || this.OverpaymentMode === null) {
      this.OverpaymentMode = OverpaymentMode.空值;
    }
    if (this.OverpaymentQty === undefined || this.OverpaymentQty === null) {
      this.OverpaymentQty = 0;
    }
    if (this.CashAccountInfoid === undefined || this.CashAccountInfoid === null) {
      this.CashAccountInfoid = 0;
    }
    if (this.CashInA === undefined || this.CashInA === null) {
      this.CashInA = 0;
    }
    if (this.BankAccountInfoid === undefined || this.BankAccountInfoid === null) {
      this.BankAccountInfoid = 0;
    }
    if (this.BankInA === undefined || this.BankInA === null) {
      this.BankInA = 0;
    }
    if (this.AcceptanceAccountInfoid === undefined || this.AcceptanceAccountInfoid === null) {
      this.AcceptanceAccountInfoid = 0;
    }
    if (this.AcceptanceInA === undefined || this.AcceptanceInA === null) {
      this.AcceptanceInA = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/PrintTemplate.cs
export class PrintTemplate extends GeneralEntityBase {
  PageName!: string;
  MainTableName!: string;
  Name!: string;
  Data!: number[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.PageName === undefined || this.PageName === null) {
      this.PageName = '';
    }
    if (this.MainTableName === undefined || this.MainTableName === null) {
      this.MainTableName = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Data === undefined || this.Data === null) {
      this.Data = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProcessAssemblyFlowDetail.cs
export class ProcessAssemblyFlowDetail extends DetailEntityBase implements IFlowCardDetail {
  SubPosition!: number | null;
  TypeofWorkid!: number;
  ProductProcessDetailid!: number;
  VestInid!: number;
  BQty!: number;
  PreCmpBQty!: number;
  BadBQty!: number;
  CmpBQty!: number;
  WorkPrice!: number;
  PieceRateWage!: number;
  OIPAmount!: number;
  Content!: string;
  WorkRequirements!: string;
  IsStarted!: boolean;
  ReceiveStatus!: ProcessStatus;
  CompleteStatus!: ProcessStatus;
  ProcessReceiveDocumentid!: number | null;
  ProcessCompletionDocumentid!: number | null;
  StepDocumentid!: number | null;
  StepDocumentType!: string;
  CanReceiveQty!: number;
  ReceivedQty!: number;
  WaitReceivedQty!: number;
  CanCompleteQty!: number;
  CompleteQty!: number;
  WaitCompleteQty!: number;
  ReceiveNotPassBQty!: number;
  CompleteNotPassBQty!: number;
  DepositedQty!: number;
  ReceivePosition!: number | null;
  CompletePosition!: number | null;
  SyncGroup!: number | null;
  ReceiveTime!: string | null;
  CompleteTime!: string | null;
  IsSplit!: boolean;
  IsReceiveDetailSplit!: boolean;
  IsCompleteDetailSplit!: boolean;
  NeedFirstInspection!: boolean;
  NeedFinalInspection!: boolean;
  AlreadyFirstInspection!: boolean;
  AlreadyFinalInspection!: boolean;
  FirstInspectionQty!: number;
  FirstReworkStatus!: ProcessStatus;
  FirstReworkQty!: number;
  FinalInspectionQty!: number;
  FinalReworkStatus!: ProcessStatus;
  FinalReworkQty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.ProductProcessDetailid === undefined || this.ProductProcessDetailid === null) {
      this.ProductProcessDetailid = 0;
    }
    if (this.VestInid === undefined || this.VestInid === null) {
      this.VestInid = 0;
    }
    if (this.BQty === undefined || this.BQty === null) {
      this.BQty = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.BadBQty === undefined || this.BadBQty === null) {
      this.BadBQty = 0;
    }
    if (this.CmpBQty === undefined || this.CmpBQty === null) {
      this.CmpBQty = 0;
    }
    if (this.WorkPrice === undefined || this.WorkPrice === null) {
      this.WorkPrice = 0;
    }
    if (this.PieceRateWage === undefined || this.PieceRateWage === null) {
      this.PieceRateWage = 0;
    }
    if (this.OIPAmount === undefined || this.OIPAmount === null) {
      this.OIPAmount = 0;
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.WorkRequirements === undefined || this.WorkRequirements === null) {
      this.WorkRequirements = '';
    }
    if (this.IsStarted === undefined || this.IsStarted === null) {
      this.IsStarted = false;
    }
    if (this.ReceiveStatus === undefined || this.ReceiveStatus === null) {
      this.ReceiveStatus = ProcessStatus.未开始 ;
    }
    if (this.CompleteStatus === undefined || this.CompleteStatus === null) {
      this.CompleteStatus = ProcessStatus.未开始 ;
    }
    if (this.StepDocumentType === undefined || this.StepDocumentType === null) {
      this.StepDocumentType = '';
    }
    if (this.CanReceiveQty === undefined || this.CanReceiveQty === null) {
      this.CanReceiveQty = 0;
    }
    if (this.ReceivedQty === undefined || this.ReceivedQty === null) {
      this.ReceivedQty = 0;
    }
    if (this.WaitReceivedQty === undefined || this.WaitReceivedQty === null) {
      this.WaitReceivedQty = 0;
    }
    if (this.CanCompleteQty === undefined || this.CanCompleteQty === null) {
      this.CanCompleteQty = 0;
    }
    if (this.CompleteQty === undefined || this.CompleteQty === null) {
      this.CompleteQty = 0;
    }
    if (this.WaitCompleteQty === undefined || this.WaitCompleteQty === null) {
      this.WaitCompleteQty = 0;
    }
    if (this.ReceiveNotPassBQty === undefined || this.ReceiveNotPassBQty === null) {
      this.ReceiveNotPassBQty = 0;
    }
    if (this.CompleteNotPassBQty === undefined || this.CompleteNotPassBQty === null) {
      this.CompleteNotPassBQty = 0;
    }
    if (this.DepositedQty === undefined || this.DepositedQty === null) {
      this.DepositedQty = 0;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.IsReceiveDetailSplit === undefined || this.IsReceiveDetailSplit === null) {
      this.IsReceiveDetailSplit = false;
    }
    if (this.IsCompleteDetailSplit === undefined || this.IsCompleteDetailSplit === null) {
      this.IsCompleteDetailSplit = false;
    }
    if (this.NeedFirstInspection === undefined || this.NeedFirstInspection === null) {
      this.NeedFirstInspection = false;
    }
    if (this.NeedFinalInspection === undefined || this.NeedFinalInspection === null) {
      this.NeedFinalInspection = false;
    }
    if (this.AlreadyFirstInspection === undefined || this.AlreadyFirstInspection === null) {
      this.AlreadyFirstInspection = false;
    }
    if (this.AlreadyFinalInspection === undefined || this.AlreadyFinalInspection === null) {
      this.AlreadyFinalInspection = false;
    }
    if (this.FirstInspectionQty === undefined || this.FirstInspectionQty === null) {
      this.FirstInspectionQty = 0;
    }
    if (this.FirstReworkStatus === undefined || this.FirstReworkStatus === null) {
      this.FirstReworkStatus = ProcessStatus.未开始 ;
    }
    if (this.FirstReworkQty === undefined || this.FirstReworkQty === null) {
      this.FirstReworkQty = 0;
    }
    if (this.FinalInspectionQty === undefined || this.FinalInspectionQty === null) {
      this.FinalInspectionQty = 0;
    }
    if (this.FinalReworkStatus === undefined || this.FinalReworkStatus === null) {
      this.FinalReworkStatus = ProcessStatus.未开始 ;
    }
    if (this.FinalReworkQty === undefined || this.FinalReworkQty === null) {
      this.FinalReworkQty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProcessAssemblyFlowDocument.cs
export class ProcessAssemblyFlowDocument extends DocumentBase implements IFlowCardDocument, IDelivery, IHasClient, IOnlyHasMaterial, IInnerKey, IQty, IScanCode {
  InnerKey!: string;
  Materialid!: number;
  Departmentid!: number;
  Clientid!: number;
  DeliveryTime!: string | null;
  PreCmpBQty!: number;
  CmpBQty!: number;
  BQty!: number;
  RoutingDocumentid!: number;
  IsCompleted!: boolean;
  IsSplit!: boolean;
  IsReceiveDetailSplit!: boolean;
  IsCompleteDetailSplit!: boolean;
  CodeForScan!: string;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.CmpBQty === undefined || this.CmpBQty === null) {
      this.CmpBQty = 0;
    }
    if (this.BQty === undefined || this.BQty === null) {
      this.BQty = 0;
    }
    if (this.RoutingDocumentid === undefined || this.RoutingDocumentid === null) {
      this.RoutingDocumentid = 0;
    }
    if (this.IsCompleted === undefined || this.IsCompleted === null) {
      this.IsCompleted = false;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.IsReceiveDetailSplit === undefined || this.IsReceiveDetailSplit === null) {
      this.IsReceiveDetailSplit = false;
    }
    if (this.IsCompleteDetailSplit === undefined || this.IsCompleteDetailSplit === null) {
      this.IsCompleteDetailSplit = false;
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProcessInfo.cs
export class ProcessInfo extends GeneralEntityBase implements IProportion, IBelong {
  BelongToid!: number;
  BelongToTableName!: string;
  TypeofWorkid!: number;
  WorkPrice!: number;
  Content!: string;
  WorkRequirements!: string;
  Note!: string;
  OriginalRatio!: number;
  CurrentRatio!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.BelongToid === undefined || this.BelongToid === null) {
      this.BelongToid = 0;
    }
    if (this.BelongToTableName === undefined || this.BelongToTableName === null) {
      this.BelongToTableName = '';
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.WorkPrice === undefined || this.WorkPrice === null) {
      this.WorkPrice = 0;
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.WorkRequirements === undefined || this.WorkRequirements === null) {
      this.WorkRequirements = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProcessUnfinishedReasons.cs
export class ProcessUnfinishedReasons extends UniqueEntity {
  Code!: number;
  Reason!: string;
  IsHide!: boolean;
  ReasonsFunctionType!: ReasonsFunctionType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = 0;
    }
    if (this.Reason === undefined || this.Reason === null) {
      this.Reason = '';
    }
    if (this.IsHide === undefined || this.IsHide === null) {
      this.IsHide = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProduceFlowDetail.cs
export class ProduceFlowDetail extends DetailEntityBase implements IFlowCardDetail {
  SubPosition!: number | null;
  TypeofWorkid!: number;
  ProductProcessDetailid!: number;
  VestInid!: number;
  BQty!: number;
  PreCmpBQty!: number;
  BadBQty!: number;
  CmpBQty!: number;
  WorkPrice!: number;
  PieceRateWage!: number;
  OIPAmount!: number;
  Content!: string;
  WorkRequirements!: string;
  IsStarted!: boolean;
  ReceiveStatus!: ProcessStatus;
  CompleteStatus!: ProcessStatus;
  ProcessReceiveDocumentid!: number | null;
  ProcessCompletionDocumentid!: number | null;
  StepDocumentid!: number | null;
  StepDocumentType!: string;
  CanReceiveQty!: number;
  ReceivedQty!: number;
  WaitReceivedQty!: number;
  CanCompleteQty!: number;
  CompleteQty!: number;
  WaitCompleteQty!: number;
  ReceiveNotPassBQty!: number;
  CompleteNotPassBQty!: number;
  DepositedQty!: number;
  ReceivePosition!: number | null;
  CompletePosition!: number | null;
  SyncGroup!: number | null;
  ReceiveTime!: string | null;
  CompleteTime!: string | null;
  IsSplit!: boolean;
  IsReceiveDetailSplit!: boolean;
  IsCompleteDetailSplit!: boolean;
  NeedFirstInspection!: boolean;
  NeedFinalInspection!: boolean;
  AlreadyFirstInspection!: boolean;
  AlreadyFinalInspection!: boolean;
  FirstInspectionQty!: number;
  FirstReworkStatus!: ProcessStatus;
  FirstReworkQty!: number;
  FinalInspectionQty!: number;
  FinalReworkStatus!: ProcessStatus;
  FinalReworkQty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.ProductProcessDetailid === undefined || this.ProductProcessDetailid === null) {
      this.ProductProcessDetailid = 0;
    }
    if (this.VestInid === undefined || this.VestInid === null) {
      this.VestInid = 0;
    }
    if (this.BQty === undefined || this.BQty === null) {
      this.BQty = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.BadBQty === undefined || this.BadBQty === null) {
      this.BadBQty = 0;
    }
    if (this.CmpBQty === undefined || this.CmpBQty === null) {
      this.CmpBQty = 0;
    }
    if (this.WorkPrice === undefined || this.WorkPrice === null) {
      this.WorkPrice = 0;
    }
    if (this.PieceRateWage === undefined || this.PieceRateWage === null) {
      this.PieceRateWage = 0;
    }
    if (this.OIPAmount === undefined || this.OIPAmount === null) {
      this.OIPAmount = 0;
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.WorkRequirements === undefined || this.WorkRequirements === null) {
      this.WorkRequirements = '';
    }
    if (this.IsStarted === undefined || this.IsStarted === null) {
      this.IsStarted = false;
    }
    if (this.ReceiveStatus === undefined || this.ReceiveStatus === null) {
      this.ReceiveStatus = ProcessStatus.未开始 ;
    }
    if (this.CompleteStatus === undefined || this.CompleteStatus === null) {
      this.CompleteStatus = ProcessStatus.未开始 ;
    }
    if (this.StepDocumentType === undefined || this.StepDocumentType === null) {
      this.StepDocumentType = '';
    }
    if (this.CanReceiveQty === undefined || this.CanReceiveQty === null) {
      this.CanReceiveQty = 0;
    }
    if (this.ReceivedQty === undefined || this.ReceivedQty === null) {
      this.ReceivedQty = 0;
    }
    if (this.WaitReceivedQty === undefined || this.WaitReceivedQty === null) {
      this.WaitReceivedQty = 0;
    }
    if (this.CanCompleteQty === undefined || this.CanCompleteQty === null) {
      this.CanCompleteQty = 0;
    }
    if (this.CompleteQty === undefined || this.CompleteQty === null) {
      this.CompleteQty = 0;
    }
    if (this.WaitCompleteQty === undefined || this.WaitCompleteQty === null) {
      this.WaitCompleteQty = 0;
    }
    if (this.ReceiveNotPassBQty === undefined || this.ReceiveNotPassBQty === null) {
      this.ReceiveNotPassBQty = 0;
    }
    if (this.CompleteNotPassBQty === undefined || this.CompleteNotPassBQty === null) {
      this.CompleteNotPassBQty = 0;
    }
    if (this.DepositedQty === undefined || this.DepositedQty === null) {
      this.DepositedQty = 0;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.IsReceiveDetailSplit === undefined || this.IsReceiveDetailSplit === null) {
      this.IsReceiveDetailSplit = false;
    }
    if (this.IsCompleteDetailSplit === undefined || this.IsCompleteDetailSplit === null) {
      this.IsCompleteDetailSplit = false;
    }
    if (this.NeedFirstInspection === undefined || this.NeedFirstInspection === null) {
      this.NeedFirstInspection = false;
    }
    if (this.NeedFinalInspection === undefined || this.NeedFinalInspection === null) {
      this.NeedFinalInspection = false;
    }
    if (this.AlreadyFirstInspection === undefined || this.AlreadyFirstInspection === null) {
      this.AlreadyFirstInspection = false;
    }
    if (this.AlreadyFinalInspection === undefined || this.AlreadyFinalInspection === null) {
      this.AlreadyFinalInspection = false;
    }
    if (this.FirstInspectionQty === undefined || this.FirstInspectionQty === null) {
      this.FirstInspectionQty = 0;
    }
    if (this.FirstReworkStatus === undefined || this.FirstReworkStatus === null) {
      this.FirstReworkStatus = ProcessStatus.未开始 ;
    }
    if (this.FirstReworkQty === undefined || this.FirstReworkQty === null) {
      this.FirstReworkQty = 0;
    }
    if (this.FinalInspectionQty === undefined || this.FinalInspectionQty === null) {
      this.FinalInspectionQty = 0;
    }
    if (this.FinalReworkStatus === undefined || this.FinalReworkStatus === null) {
      this.FinalReworkStatus = ProcessStatus.未开始 ;
    }
    if (this.FinalReworkQty === undefined || this.FinalReworkQty === null) {
      this.FinalReworkQty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProduceFlowDocument.cs
export class ProduceFlowDocument extends DocumentBase implements IFlowCardDocument, IOnlyHasMaterial, IDelivery, IHasClient, IInnerKey {
  InnerKey!: string;
  Materialid!: number;
  Departmentid!: number;
  Clientid!: number;
  DeliveryTime!: string | null;
  PreCmpBQty!: number;
  CmpBQty!: number;
  BQty!: number;
  RoutingDocumentid!: number;
  IsCompleted!: boolean;
  IsSplit!: boolean;
  IsReceiveDetailSplit!: boolean;
  IsCompleteDetailSplit!: boolean;
  CodeForScan!: string;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.CmpBQty === undefined || this.CmpBQty === null) {
      this.CmpBQty = 0;
    }
    if (this.BQty === undefined || this.BQty === null) {
      this.BQty = 0;
    }
    if (this.RoutingDocumentid === undefined || this.RoutingDocumentid === null) {
      this.RoutingDocumentid = 0;
    }
    if (this.IsCompleted === undefined || this.IsCompleted === null) {
      this.IsCompleted = false;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.IsReceiveDetailSplit === undefined || this.IsReceiveDetailSplit === null) {
      this.IsReceiveDetailSplit = false;
    }
    if (this.IsCompleteDetailSplit === undefined || this.IsCompleteDetailSplit === null) {
      this.IsCompleteDetailSplit = false;
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Component/ProductionCompletionDetail.cs
export class ProductionCompletionDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IBringProcess, IDelivery, IScanCode, IUseBom, IUnit, IDUnit, IInnerKey {
  IsUseBringProcess!: boolean;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  InnerKey!: string;
  Qty!: number;
  DQty!: number;
  DeliveryTime!: string | null;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseBringProcess === undefined || this.IsUseBringProcess === null) {
      this.IsUseBringProcess = false;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Component/ProductionCompletionDocument.cs
export class ProductionCompletionDocument extends DocumentBase implements IInnerKey {
  Departmentid!: number;
  InnerKey!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProductionProcessCompletionDetail.cs
export class ProductionProcessCompletionDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProductionProcessCompletionDocument.cs
export class ProductionProcessCompletionDocument extends DocumentBase implements IFlowCardProcessCompletionDocument, IInnerKey, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Warehouseid!: number;
  Employeeid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckResult!: CheckResult;
  TypeofWorkid!: number;
  PreCmpBQty!: number;
  PreCmpQty!: number;
  ChkBQty!: number;
  ChkQty!: number;
  PassBQty!: number;
  PassQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  NotPassQty!: number;
  InnerKey!: string;
  WaitCompleteQty!: number;
  IsScrap!: boolean;
  IsSplit!: boolean;
  UnfinishedReasonsid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.PreCmpQty === undefined || this.PreCmpQty === null) {
      this.PreCmpQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.ChkQty === undefined || this.ChkQty === null) {
      this.ChkQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassQty === undefined || this.PassQty === null) {
      this.PassQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.NotPassQty === undefined || this.NotPassQty === null) {
      this.NotPassQty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.WaitCompleteQty === undefined || this.WaitCompleteQty === null) {
      this.WaitCompleteQty = 0;
    }
    if (this.IsScrap === undefined || this.IsScrap === null) {
      this.IsScrap = false;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.UnfinishedReasonsid === undefined || this.UnfinishedReasonsid === null) {
      this.UnfinishedReasonsid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProductionProcessReceiveDetail.cs
export class ProductionProcessReceiveDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Produce/ProductionProcessReceiveDocument.cs
export class ProductionProcessReceiveDocument extends DocumentBase implements IFlowCardProcessReceiveDocument, IInnerKey, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Warehouseid!: number;
  Employeeid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckResult!: CheckResult;
  TypeofWorkid!: number;
  PreCmpBQty!: number;
  PreCmpQty!: number;
  ChkBQty!: number;
  ChkQty!: number;
  PassBQty!: number;
  PassQty!: number;
  NotPassBQty!: number;
  NotPassQty!: number;
  RQty!: number;
  InnerKey!: string;
  WaitReceivedQty!: number;
  IsScrap!: boolean;
  IsSplit!: boolean;
  UnfinishedReasonsid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.PreCmpQty === undefined || this.PreCmpQty === null) {
      this.PreCmpQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.ChkQty === undefined || this.ChkQty === null) {
      this.ChkQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassQty === undefined || this.PassQty === null) {
      this.PassQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.NotPassQty === undefined || this.NotPassQty === null) {
      this.NotPassQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.WaitReceivedQty === undefined || this.WaitReceivedQty === null) {
      this.WaitReceivedQty = 0;
    }
    if (this.IsScrap === undefined || this.IsScrap === null) {
      this.IsScrap = false;
    }
    if (this.IsSplit === undefined || this.IsSplit === null) {
      this.IsSplit = false;
    }
    if (this.UnfinishedReasonsid === undefined || this.UnfinishedReasonsid === null) {
      this.UnfinishedReasonsid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProductProcessDetail.cs
export class ProductProcessDetail extends DetailEntityBase {
  TypeofWorkid!: number;
  ProcessPosition!: number;
  WorkPriceBase!: number;
  WorkPrice!: number;
  ProcessType!: ProcessType;
  ProportioningNumber!: number;
  Content!: string;
  WorkRequirements!: string;
  Materialid!: number;
  Level!: string;
  Equipment!: string;
  Levelid!: number;
  Equipmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.ProcessPosition === undefined || this.ProcessPosition === null) {
      this.ProcessPosition = 0;
    }
    if (this.WorkPriceBase === undefined || this.WorkPriceBase === null) {
      this.WorkPriceBase = 0;
    }
    if (this.WorkPrice === undefined || this.WorkPrice === null) {
      this.WorkPrice = 0;
    }
    if (this.ProcessType === undefined || this.ProcessType === null) {
      this.ProcessType = ProcessType.特殊单据 ;
    }
    if (this.ProportioningNumber === undefined || this.ProportioningNumber === null) {
      this.ProportioningNumber = 0;
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.WorkRequirements === undefined || this.WorkRequirements === null) {
      this.WorkRequirements = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Level === undefined || this.Level === null) {
      this.Level = '';
    }
    if (this.Equipment === undefined || this.Equipment === null) {
      this.Equipment = '';
    }
    if (this.Levelid === undefined || this.Levelid === null) {
      this.Levelid = 0;
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/ProductProcessDocument.cs
export class ProductProcessDocument extends DocumentBase {
  Materialid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AP/PurchaseCheckDetail.cs
export class PurchaseCheckDetail extends DetailEntityBase implements IOnlyHasMaterial, IQty, IDQty, IHasMoney, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  Note!: any;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AP/PurchaseCheckDocument.cs
export class PurchaseCheckDocument extends DocumentBase implements IHasSupplier, IFinanceDocument, IHasTax {
  Supplierid!: number;
  Departmentid!: number;
  Year!: number;
  Stage!: number;
  CheckIntervalStart!: string;
  CheckIntervalEnd!: string;
  TaxMode!: string;
  TaxRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Year === undefined || this.Year === null) {
      this.Year = 0;
    }
    if (this.Stage === undefined || this.Stage === null) {
      this.Stage = 0;
    }
    if (this.CheckIntervalStart === undefined || this.CheckIntervalStart === null) {
      this.CheckIntervalStart = '';
    }
    if (this.CheckIntervalEnd === undefined || this.CheckIntervalEnd === null) {
      this.CheckIntervalEnd = '';
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/PurchaseDetail.cs
export class PurchaseDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  ProcessingPrice!: number;
  CopperPrice!: number;
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Note!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.CopperPrice === undefined || this.CopperPrice === null) {
      this.CopperPrice = 0;
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseBackReceiveDetail.cs
export class PurchaseBackReceiveDetail extends PurchaseDetail {
  Document!: PurchaseBackReceiveDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new PurchaseBackReceiveDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/PurchaseDocument.cs
export class PurchaseDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasTax, IHasSupplier {
  Supplierid!: number;
  PurchaseDepartmentid!: number;
  SalesManid!: number;
  TaxMode!: string;
  Warehouseid!: number;
  TaxRate!: number;
  DeliveryTime!: string | null;
  Note!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchaseDepartmentid === undefined || this.PurchaseDepartmentid === null) {
      this.PurchaseDepartmentid = 0;
    }
    if (this.SalesManid === undefined || this.SalesManid === null) {
      this.SalesManid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/PurchaseDocumentBuying.cs
export class PurchaseDocumentBuying extends PurchaseDocument {
  TransportMode!: string;
  PaymentMode!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AP/OutsourcedVerificationDocument.cs
export class OutsourcedVerificationDocument extends PurchaseDocumentBuying {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseBackReceiveDocument.cs
export class PurchaseBackReceiveDocument extends PurchaseDocumentBuying {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseOrderDetail.cs
export class PurchaseOrderDetail extends PurchaseDetail {
  Document!: PurchaseOrderDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new PurchaseOrderDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseOrderDocument.cs
export class PurchaseOrderDocument extends PurchaseDocumentBuying {
  ContractTemplateid!: number;
  ContractDetails!: string;
  ContractDetailDict!: Record<string, string>;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ContractTemplateid === undefined || this.ContractTemplateid === null) {
      this.ContractTemplateid = 0;
    }
    if (this.ContractDetails === undefined || this.ContractDetails === null) {
      this.ContractDetails = '';
    }
    if (this.ContractDetailDict === undefined || this.ContractDetailDict === null) {
      this.ContractDetailDict = {} as any;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchasePolicy.cs
export class PurchasePolicy extends UniqueEntity {
  Supplierid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchasePolicyDetail.cs
export class PurchasePolicyDetail extends EntityBase implements IChild, IPurchasePolicyDetailUnmanaged {
  Materialid!: number;
  Supplierid!: number;
  ParentTypeid!: number;
  Note!: string;
  Current!: number;
  HistoryPrice!: number | null;
  HistoryPrice1!: number | null;
  HistoryPrice2!: number | null;
  HistoryPrice3!: number | null;
  CurrentLastTimeSourceDocumentid!: number;
  CurrentLastTimeSourceDocumentType!: string;
  CurrentLastTimeSourceDocumentTime!: string | null;
  HistoryPriceLastTimeSourceDocumentid!: number;
  HistoryPriceLastTimeSourceDocumentType!: string;
  HistoryPriceLastTimeSourceDocumentTime!: string | null;
  HistoryPrice1LastTimeSourceDocumentid!: number;
  HistoryPrice1LastTimeSourceDocumentType!: string;
  HistoryPrice1LastTimeSourceDocumentTime!: string | null;
  HistoryPrice2LastTimeSourceDocumentid!: number;
  HistoryPrice2LastTimeSourceDocumentType!: string;
  HistoryPrice2LastTimeSourceDocumentTime!: string | null;
  HistoryPrice3LastTimeSourceDocumentid!: number;
  HistoryPrice3LastTimeSourceDocumentType!: string;
  HistoryPrice3LastTimeSourceDocumentTime!: string | null;
  PurchasePrices!: number;
  ProcessingPrice!: number;
  ProcurementPeriod!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.ParentTypeid === undefined || this.ParentTypeid === null) {
      this.ParentTypeid = 0;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Current === undefined || this.Current === null) {
      this.Current = 0;
    }
    if (this.CurrentLastTimeSourceDocumentid === undefined || this.CurrentLastTimeSourceDocumentid === null) {
      this.CurrentLastTimeSourceDocumentid = 0;
    }
    if (this.CurrentLastTimeSourceDocumentType === undefined || this.CurrentLastTimeSourceDocumentType === null) {
      this.CurrentLastTimeSourceDocumentType = '';
    }
    if (this.HistoryPriceLastTimeSourceDocumentid === undefined || this.HistoryPriceLastTimeSourceDocumentid === null) {
      this.HistoryPriceLastTimeSourceDocumentid = 0;
    }
    if (this.HistoryPriceLastTimeSourceDocumentType === undefined || this.HistoryPriceLastTimeSourceDocumentType === null) {
      this.HistoryPriceLastTimeSourceDocumentType = '';
    }
    if (this.HistoryPrice1LastTimeSourceDocumentid === undefined || this.HistoryPrice1LastTimeSourceDocumentid === null) {
      this.HistoryPrice1LastTimeSourceDocumentid = 0;
    }
    if (this.HistoryPrice1LastTimeSourceDocumentType === undefined || this.HistoryPrice1LastTimeSourceDocumentType === null) {
      this.HistoryPrice1LastTimeSourceDocumentType = '';
    }
    if (this.HistoryPrice2LastTimeSourceDocumentid === undefined || this.HistoryPrice2LastTimeSourceDocumentid === null) {
      this.HistoryPrice2LastTimeSourceDocumentid = 0;
    }
    if (this.HistoryPrice2LastTimeSourceDocumentType === undefined || this.HistoryPrice2LastTimeSourceDocumentType === null) {
      this.HistoryPrice2LastTimeSourceDocumentType = '';
    }
    if (this.HistoryPrice3LastTimeSourceDocumentid === undefined || this.HistoryPrice3LastTimeSourceDocumentid === null) {
      this.HistoryPrice3LastTimeSourceDocumentid = 0;
    }
    if (this.HistoryPrice3LastTimeSourceDocumentType === undefined || this.HistoryPrice3LastTimeSourceDocumentType === null) {
      this.HistoryPrice3LastTimeSourceDocumentType = '';
    }
    if (this.PurchasePrices === undefined || this.PurchasePrices === null) {
      this.PurchasePrices = 0;
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.ProcurementPeriod === undefined || this.ProcurementPeriod === null) {
      this.ProcurementPeriod = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchasePolicyDetailUnmanaged.cs
export class PurchasePolicyDetailUnmanaged extends EntityBase implements IPurchasePolicyDetailUnmanaged {
  Materialid!: number;
  Supplierid!: number;
  PurchasePrices!: number;
  ProcessingPrice!: number;
  ProcurementPeriod!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.PurchasePrices === undefined || this.PurchasePrices === null) {
      this.PurchasePrices = 0;
    }
    if (this.ProcessingPrice === undefined || this.ProcessingPrice === null) {
      this.ProcessingPrice = 0;
    }
    if (this.ProcurementPeriod === undefined || this.ProcurementPeriod === null) {
      this.ProcurementPeriod = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseReceiveDetail.cs
export class PurchaseReceiveDetail extends PurchaseDetail implements IInspectionRequired {
  IsUseInspectionRequired!: boolean;
  Document!: PurchaseReceiveDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseInspectionRequired === undefined || this.IsUseInspectionRequired === null) {
      this.IsUseInspectionRequired = false;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new PurchaseReceiveDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseReceiveDocument.cs
export class PurchaseReceiveDocument extends PurchaseDocumentBuying {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseRequestDetail.cs
export class PurchaseRequestDetail extends PurchaseDetail {
  Document!: PurchaseRequestDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new PurchaseRequestDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseRequestDocument.cs
export class PurchaseRequestDocument extends PurchaseDocument {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseReturnOrderDetail.cs
export class PurchaseReturnOrderDetail extends PurchaseDetail implements IInspectionRequired {
  IsUseInspectionRequired!: boolean;
  Document!: PurchaseReturnOrderDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseInspectionRequired === undefined || this.IsUseInspectionRequired === null) {
      this.IsUseInspectionRequired = false;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new PurchaseReturnOrderDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseReturnOrderDocument.cs
export class PurchaseReturnOrderDocument extends PurchaseDocumentBuying {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseStockInDetail.cs
export class PurchaseStockInDetail extends PurchaseDetail {
  Document!: PurchaseStockInDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new PurchaseStockInDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseStockInDocument.cs
export class PurchaseStockInDocument extends PurchaseDocumentBuying {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseStockOutDetail.cs
export class PurchaseStockOutDetail extends PurchaseDetail {
  Document!: PurchaseStockOutDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new PurchaseStockOutDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Purchase/PurchaseStockOutDocument.cs
export class PurchaseStockOutDocument extends PurchaseDocumentBuying {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/ReconciliationInterval.cs
export class ReconciliationInterval extends UniqueEntity {
  Name!: string;
  Year!: number;
  Stage!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Year === undefined || this.Year === null) {
      this.Year = 0;
    }
    if (this.Stage === undefined || this.Stage === null) {
      this.Stage = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/ReferenceInfo.cs
export class ReferenceInfo extends UniqueEntity {
  ParentTableName!: string;
  ParentTableid!: number;
  ChildTableName!: string;
  ChildTableid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ParentTableName === undefined || this.ParentTableName === null) {
      this.ParentTableName = '';
    }
    if (this.ParentTableid === undefined || this.ParentTableid === null) {
      this.ParentTableid = 0;
    }
    if (this.ChildTableName === undefined || this.ChildTableName === null) {
      this.ChildTableName = '';
    }
    if (this.ChildTableid === undefined || this.ChildTableid === null) {
      this.ChildTableid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/RoutingDetail.cs
export class RoutingDetail extends DetailEntityBase {
  TypeofWorkid!: number;
  WorkPriceBase!: number;
  WorkPrice!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TypeofWorkid === undefined || this.TypeofWorkid === null) {
      this.TypeofWorkid = 0;
    }
    if (this.WorkPriceBase === undefined || this.WorkPriceBase === null) {
      this.WorkPriceBase = 0;
    }
    if (this.WorkPrice === undefined || this.WorkPrice === null) {
      this.WorkPrice = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/RoutingDocument.cs
export class RoutingDocument extends DocumentBase implements IPause {
  Name!: string;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/SaleOutBackCheckDetail.cs
export class SaleOutBackCheckDetail extends DetailEntityBase implements IOnlyHasMaterial, IQty, IDQty, IHasMoney, IUnit, IDUnit {
  Materialid!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  Note!: any;
  AmountReceived!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.AmountReceived === undefined || this.AmountReceived === null) {
      this.AmountReceived = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/SaleOutBackCheckDocument.cs
export class SaleOutBackCheckDocument extends DocumentBase implements IHasClient, IHasTax, IFinanceDocument {
  Clientid!: number;
  Departmentid!: number;
  Year!: number;
  Stage!: number;
  CheckIntervalStart!: string;
  CheckIntervalEnd!: string;
  TaxMode!: string;
  TaxRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Year === undefined || this.Year === null) {
      this.Year = 0;
    }
    if (this.Stage === undefined || this.Stage === null) {
      this.Stage = 0;
    }
    if (this.CheckIntervalStart === undefined || this.CheckIntervalStart === null) {
      this.CheckIntervalStart = '';
    }
    if (this.CheckIntervalEnd === undefined || this.CheckIntervalEnd === null) {
      this.CheckIntervalEnd = '';
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/SaleOutBackUDetail.cs
export class SaleOutBackUDetail extends DetailEntityBase implements IOnlyHasMaterial, IQty, IDQty, IHasMoney, IUnit, IDUnit {
  Materialid!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/AR/SaleOutBackUDocument.cs
export class SaleOutBackUDocument extends DocumentBase implements IHasMoneyDocument, IHasClient, IHasTax {
  Clientid!: number;
  Departmentid!: number;
  TaxMode!: string;
  TaxRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/SalesDetail.cs
export class SalesDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUseBom, IUnit, IDUnit {
  Materialid!: number;
  Warehouseid!: number;
  UseBomid!: number;
  OriginalRatio!: number;
  CurrentRatio!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Description!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  ProductionDeliveryTime!: string | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.UseBomid === undefined || this.UseBomid === null) {
      this.UseBomid = 0;
    }
    if (this.OriginalRatio === undefined || this.OriginalRatio === null) {
      this.OriginalRatio = 0;
    }
    if (this.CurrentRatio === undefined || this.CurrentRatio === null) {
      this.CurrentRatio = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Description === undefined || this.Description === null) {
      this.Description = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/SalesDocument.cs
export class SalesDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasClient, IHasTax {
  Clientid!: number;
  Warehouseid!: number;
  Departmentid!: number;
  SalesPersonid!: number | null;
  ClientBusinessOwnerid!: number | null;
  DeliveryTime!: string | null;
  TaxRate!: number;
  TransportMode!: string;
  TaxMode!: string;
  PaymentMode!: string;
  Label!: string;
  ContractNum!: string;
  Note!: string;
  SpecialNeeds!: ClientSpecialNeeds;
  ProductionDeliveryTime!: string | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
    if (this.Label === undefined || this.Label === null) {
      this.Label = '';
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.SpecialNeeds === undefined || this.SpecialNeeds === null) {
      this.SpecialNeeds = ClientSpecialNeeds.需装箱_追溯 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesInvoicesDetail.cs
export class SalesInvoicesDetail extends SalesDetail implements IInspectionRequired, IInnerKey {
  IsUseInspectionRequired!: boolean;
  InnerKey!: string;
  Document!: SalesInvoicesDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.IsUseInspectionRequired === undefined || this.IsUseInspectionRequired === null) {
      this.IsUseInspectionRequired = false;
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new SalesInvoicesDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesInvoicesDocument.cs
export class SalesInvoicesDocument extends SalesDocument {
  LotNumber!: string;
  Details!: SalesInvoicesDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.LotNumber === undefined || this.LotNumber === null) {
      this.LotNumber = '';
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesOrderDetail.cs
export class SalesOrderDetail extends SalesDetail {
  Document!: SalesOrderDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new SalesOrderDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesOrderDocument.cs
export class SalesOrderDocument extends SalesDocument {
  LotNumber!: string;
  Details!: SalesOrderDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.LotNumber === undefined || this.LotNumber === null) {
      this.LotNumber = '';
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesPackDetail.cs
export class SalesPackDetail extends DetailEntityBase implements IHasMaterial, IQty, IDQty, IDelivery, IHasMoney, IUnit, IDUnit, IInnerKey {
  InnerKey!: string;
  CartonNumber!: string;
  Materialid!: number;
  Warehouseid!: number;
  Qty!: number;
  DQty!: number;
  UnitPrice!: number;
  WeiShuiDanJia!: number;
  HanShuiDanJia!: number;
  WeiShuiJinE!: number;
  JiaShuiJinE!: number;
  TaxAmount!: number;
  DeliveryTime!: string | null;
  Description!: string;
  Unitid!: number;
  DeputyUnitid!: number;
  PushBackMode!: PushBackMode;
  DeputyConversionRate!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.CartonNumber === undefined || this.CartonNumber === null) {
      this.CartonNumber = '';
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
    if (this.DQty === undefined || this.DQty === null) {
      this.DQty = 0;
    }
    if (this.UnitPrice === undefined || this.UnitPrice === null) {
      this.UnitPrice = 0;
    }
    if (this.WeiShuiDanJia === undefined || this.WeiShuiDanJia === null) {
      this.WeiShuiDanJia = 0;
    }
    if (this.HanShuiDanJia === undefined || this.HanShuiDanJia === null) {
      this.HanShuiDanJia = 0;
    }
    if (this.WeiShuiJinE === undefined || this.WeiShuiJinE === null) {
      this.WeiShuiJinE = 0;
    }
    if (this.JiaShuiJinE === undefined || this.JiaShuiJinE === null) {
      this.JiaShuiJinE = 0;
    }
    if (this.TaxAmount === undefined || this.TaxAmount === null) {
      this.TaxAmount = 0;
    }
    if (this.Description === undefined || this.Description === null) {
      this.Description = '';
    }
    if (this.Unitid === undefined || this.Unitid === null) {
      this.Unitid = 0;
    }
    if (this.DeputyUnitid === undefined || this.DeputyUnitid === null) {
      this.DeputyUnitid = 0;
    }
    if (this.DeputyConversionRate === undefined || this.DeputyConversionRate === null) {
      this.DeputyConversionRate = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesPackDocument.cs
export class SalesPackDocument extends DocumentBase implements IDelivery, IHasMoneyDocument, IHasClient, IHasTax {
  Clientid!: number;
  Warehouseid!: number;
  Departmentid!: number;
  SalesPersonid!: number | null;
  DeliveryTime!: string | null;
  TaxRate!: number;
  TransportMode!: string;
  TaxMode!: string;
  PaymentMode!: string;
  Label!: string;
  ContractNum!: string;
  LotNumber!: string;
  Note!: string;
  Details!: SalesPackDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.Warehouseid === undefined || this.Warehouseid === null) {
      this.Warehouseid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.TaxRate === undefined || this.TaxRate === null) {
      this.TaxRate = 0;
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
    if (this.Label === undefined || this.Label === null) {
      this.Label = '';
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.LotNumber === undefined || this.LotNumber === null) {
      this.LotNumber = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Basic/SalesReturnDetail.cs
export class SalesReturnDetail extends SalesDetail {
  TuiHuoLiYou!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TuiHuoLiYou === undefined || this.TuiHuoLiYou === null) {
      this.TuiHuoLiYou = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesReturnEntryDetail.cs
export class SalesReturnEntryDetail extends SalesReturnDetail {
  ReplenishmentMode!: ReplenishmentMode;
  Document!: SalesReturnEntryDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ReplenishmentMode === undefined || this.ReplenishmentMode === null) {
      this.ReplenishmentMode = ReplenishmentMode.需要补货 ;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new SalesReturnEntryDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesReturnEntryDocument.cs
export class SalesReturnEntryDocument extends SalesDocument {
  ReplenishmentMode!: ReplenishmentMode;
  Details!: SalesReturnEntryDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ReplenishmentMode === undefined || this.ReplenishmentMode === null) {
      this.ReplenishmentMode = ReplenishmentMode.需要补货 ;
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesReturnFormDetail.cs
export class SalesReturnFormDetail extends SalesReturnDetail {
  ReplenishmentMode!: ReplenishmentMode;
  Document!: SalesReturnFormDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ReplenishmentMode === undefined || this.ReplenishmentMode === null) {
      this.ReplenishmentMode = ReplenishmentMode.需要补货 ;
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new SalesReturnFormDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesReturnFormDocument.cs
export class SalesReturnFormDocument extends SalesDocument {
  ReplenishmentMode!: ReplenishmentMode;
  Details!: SalesReturnFormDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ReplenishmentMode === undefined || this.ReplenishmentMode === null) {
      this.ReplenishmentMode = ReplenishmentMode.需要补货 ;
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesStockOutDetail.cs
export class SalesStockOutDetail extends SalesDetail {
  Document!: SalesStockOutDocument;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Document === undefined || this.Document === null) {
      this.Document = new SalesStockOutDocument();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Sales/SalesStockOutDocument.cs
export class SalesStockOutDocument extends SalesDocument {
  LotNumber!: string;
  Details!: SalesStockOutDetail[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.LotNumber === undefined || this.LotNumber === null) {
      this.LotNumber = '';
    }
    if (this.Details === undefined || this.Details === null) {
      this.Details = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/SamplingInspectionRule.cs
export class SamplingInspectionRule extends GeneralEntityBase {
  Name!: string;
  IsEnableCode!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IsEnableCode === undefined || this.IsEnableCode === null) {
      this.IsEnableCode = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/SamplingInspectionRuleCodeDetail.cs
export class SamplingInspectionRuleCodeDetail extends ChildEntityBase {
  InspectionLevel!: string;
  SeverityLevel!: SeverityLevel;
  SampleSizeCode!: string;
  InspectionQty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InspectionLevel === undefined || this.InspectionLevel === null) {
      this.InspectionLevel = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.SampleSizeCode === undefined || this.SampleSizeCode === null) {
      this.SampleSizeCode = '';
    }
    if (this.InspectionQty === undefined || this.InspectionQty === null) {
      this.InspectionQty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/SamplingInspectionRuleDetail.cs
export class SamplingInspectionRuleDetail extends ChildEntityBase {
  InspectionLevel!: string;
  SeverityLevel!: SeverityLevel;
  MinInMatchRange!: number;
  RangeSeparator!: string;
  MaxInMatchRange!: number;
  SampleSizeCode!: string;
  InspectionQty!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.InspectionLevel === undefined || this.InspectionLevel === null) {
      this.InspectionLevel = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.MinInMatchRange === undefined || this.MinInMatchRange === null) {
      this.MinInMatchRange = 0;
    }
    if (this.RangeSeparator === undefined || this.RangeSeparator === null) {
      this.RangeSeparator = '';
    }
    if (this.MaxInMatchRange === undefined || this.MaxInMatchRange === null) {
      this.MaxInMatchRange = 0;
    }
    if (this.SampleSizeCode === undefined || this.SampleSizeCode === null) {
      this.SampleSizeCode = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Other/SpiderForSMM.cs
export class SpiderForSMM extends UniqueEntity {
  GetTime!: string;
  PriceDate!: string;
  Price!: number;
  ProductName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.GetTime === undefined || this.GetTime === null) {
      this.GetTime = '';
    }
    if (this.PriceDate === undefined || this.PriceDate === null) {
      this.PriceDate = '';
    }
    if (this.Price === undefined || this.Price === null) {
      this.Price = 0;
    }
    if (this.ProductName === undefined || this.ProductName === null) {
      this.ProductName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/StockOutCheckDetail.cs
export class StockOutCheckDetail extends DetailEntityBase {
  ProjectName!: string;
  Content!: string;
  ChkBQty!: number;
  PassBQty!: number;
  PassRate!: number;
  CheckResult!: CheckResult;
  AQL!: string;
  ACRE!: string;
  Method!: string;
  Frequency!: string;
  MeasuredRecord1!: string;
  MeasuredRecord2!: string;
  MeasuredRecord3!: string;
  MeasuredRecord4!: string;
  MeasuredRecord5!: string;
  DownQValue!: string;
  UpQValue!: string;
  CmpQValue!: string;
  KeepDecimal!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ProjectName === undefined || this.ProjectName === null) {
      this.ProjectName = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.PassRate === undefined || this.PassRate === null) {
      this.PassRate = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.AQL === undefined || this.AQL === null) {
      this.AQL = '';
    }
    if (this.ACRE === undefined || this.ACRE === null) {
      this.ACRE = '';
    }
    if (this.Method === undefined || this.Method === null) {
      this.Method = '';
    }
    if (this.Frequency === undefined || this.Frequency === null) {
      this.Frequency = '';
    }
    if (this.MeasuredRecord1 === undefined || this.MeasuredRecord1 === null) {
      this.MeasuredRecord1 = '';
    }
    if (this.MeasuredRecord2 === undefined || this.MeasuredRecord2 === null) {
      this.MeasuredRecord2 = '';
    }
    if (this.MeasuredRecord3 === undefined || this.MeasuredRecord3 === null) {
      this.MeasuredRecord3 = '';
    }
    if (this.MeasuredRecord4 === undefined || this.MeasuredRecord4 === null) {
      this.MeasuredRecord4 = '';
    }
    if (this.MeasuredRecord5 === undefined || this.MeasuredRecord5 === null) {
      this.MeasuredRecord5 = '';
    }
    if (this.DownQValue === undefined || this.DownQValue === null) {
      this.DownQValue = '';
    }
    if (this.UpQValue === undefined || this.UpQValue === null) {
      this.UpQValue = '';
    }
    if (this.CmpQValue === undefined || this.CmpQValue === null) {
      this.CmpQValue = '';
    }
    if (this.KeepDecimal === undefined || this.KeepDecimal === null) {
      this.KeepDecimal = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Check/StockOutCheckDocument.cs
export class StockOutCheckDocument extends DocumentBase implements IHasClient, IOnlyHasMaterial, IHasEmployee, IInnerKey, IQty, IInspectionDocument {
  Materialid!: number;
  Departmentid!: number;
  Employeeid!: number;
  Clientid!: number;
  CheckMethodid!: number;
  CheckCaseDocumentid!: number;
  HandlingMethodid!: number;
  CheckDeliveryTime!: string | null;
  CheckResult!: CheckResult;
  PreCmpBQty!: number;
  ChkBQty!: number;
  PassBQty!: number;
  RQty!: number;
  NotPassBQty!: number;
  Cname!: string;
  InnerKey!: string;
  OrderDocumentCode!: string;
  SeverityLevel!: SeverityLevel;
  Qty!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Materialid === undefined || this.Materialid === null) {
      this.Materialid = 0;
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
    if (this.Employeeid === undefined || this.Employeeid === null) {
      this.Employeeid = 0;
    }
    if (this.Clientid === undefined || this.Clientid === null) {
      this.Clientid = 0;
    }
    if (this.CheckMethodid === undefined || this.CheckMethodid === null) {
      this.CheckMethodid = 0;
    }
    if (this.CheckCaseDocumentid === undefined || this.CheckCaseDocumentid === null) {
      this.CheckCaseDocumentid = 0;
    }
    if (this.HandlingMethodid === undefined || this.HandlingMethodid === null) {
      this.HandlingMethodid = 0;
    }
    if (this.CheckResult === undefined || this.CheckResult === null) {
      this.CheckResult = CheckResult.合格 ;
    }
    if (this.PreCmpBQty === undefined || this.PreCmpBQty === null) {
      this.PreCmpBQty = 0;
    }
    if (this.ChkBQty === undefined || this.ChkBQty === null) {
      this.ChkBQty = 0;
    }
    if (this.PassBQty === undefined || this.PassBQty === null) {
      this.PassBQty = 0;
    }
    if (this.RQty === undefined || this.RQty === null) {
      this.RQty = 0;
    }
    if (this.NotPassBQty === undefined || this.NotPassBQty === null) {
      this.NotPassBQty = 0;
    }
    if (this.Cname === undefined || this.Cname === null) {
      this.Cname = '';
    }
    if (this.InnerKey === undefined || this.InnerKey === null) {
      this.InnerKey = '';
    }
    if (this.OrderDocumentCode === undefined || this.OrderDocumentCode === null) {
      this.OrderDocumentCode = '';
    }
    if (this.SeverityLevel === undefined || this.SeverityLevel === null) {
      this.SeverityLevel = SeverityLevel.减量 ;
    }
    if (this.Qty === undefined || this.Qty === null) {
      this.Qty = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Supplier.cs
export class Supplier extends Partner implements ISupplier {
  TaxRegistrationAccount!: string;
  VATRate!: number;
  DepositBank!: string;
  Note!: string;
  Type!: string;
  MainLinkmanid!: any;
  SupplierType!: SupplierType;
  AccountingPeriod!: number;
  WrittenOffNotReceived!: number;
  WrittenOffNotReceivedBeforeTheCreditPeriod!: number;
  SupplierLinkmanList!: SupplierLinkman[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.TaxRegistrationAccount === undefined || this.TaxRegistrationAccount === null) {
      this.TaxRegistrationAccount = '';
    }
    if (this.VATRate === undefined || this.VATRate === null) {
      this.VATRate = 0;
    }
    if (this.DepositBank === undefined || this.DepositBank === null) {
      this.DepositBank = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.Type === undefined || this.Type === null) {
      this.Type = '';
    }
    if (this.SupplierType === undefined || this.SupplierType === null) {
      this.SupplierType = SupplierType.正式;
    }
    if (this.AccountingPeriod === undefined || this.AccountingPeriod === null) {
      this.AccountingPeriod = 0;
    }
    if (this.WrittenOffNotReceived === undefined || this.WrittenOffNotReceived === null) {
      this.WrittenOffNotReceived = 0;
    }
    if (this.WrittenOffNotReceivedBeforeTheCreditPeriod === undefined || this.WrittenOffNotReceivedBeforeTheCreditPeriod === null) {
      this.WrittenOffNotReceivedBeforeTheCreditPeriod = 0;
    }
    if (this.SupplierLinkmanList === undefined || this.SupplierLinkmanList === null) {
      this.SupplierLinkmanList = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SupplierLinkman.cs
export class SupplierLinkman extends LinkmanBase implements IHasSupplier {
  Supplierid!: number;
  Supplier!: Supplier;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.Supplier === undefined || this.Supplier === null) {
      this.Supplier = new Supplier();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SupplierModifyDetail.cs
export class SupplierModifyDetail extends DetailEntityBase implements IUniversalModifyDetail, IPartner, ISupplier {
  Targetid!: number;
  ChangeTimeType!: ChangeTimeType;
  PairKey!: number;
  IsPause!: boolean;
  Code!: string;
  Name!: string;
  ShortName!: string;
  ContractNum!: string;
  MainLinkmanid!: number;
  EmergencyLinkmanid!: number;
  ProofDay!: number | null;
  TransportMode!: string;
  TaxMode!: string;
  PaymentMode!: string;
  TaxRate!: number | null;
  NameOfVATCompany!: string;
  VATTelephone!: string;
  VATBankAddress!: string;
  BankAccount!: string;
  Address!: string;
  TaxRegistrationAccount!: string;
  VATRate!: number;
  DepositBank!: string;
  Note!: string;
  SupplierType!: SupplierType;
  AccountingPeriod!: number;
  WrittenOffNotReceived!: number;
  WrittenOffNotReceivedBeforeTheCreditPeriod!: number;
  Supplierid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Targetid === undefined || this.Targetid === null) {
      this.Targetid = 0;
    }
    if (this.ChangeTimeType === undefined || this.ChangeTimeType === null) {
      this.ChangeTimeType = ChangeTimeType.None;
    }
    if (this.PairKey === undefined || this.PairKey === null) {
      this.PairKey = 0;
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.ShortName === undefined || this.ShortName === null) {
      this.ShortName = '';
    }
    if (this.ContractNum === undefined || this.ContractNum === null) {
      this.ContractNum = '';
    }
    if (this.MainLinkmanid === undefined || this.MainLinkmanid === null) {
      this.MainLinkmanid = 0;
    }
    if (this.EmergencyLinkmanid === undefined || this.EmergencyLinkmanid === null) {
      this.EmergencyLinkmanid = 0;
    }
    if (this.TransportMode === undefined || this.TransportMode === null) {
      this.TransportMode = '';
    }
    if (this.TaxMode === undefined || this.TaxMode === null) {
      this.TaxMode = '';
    }
    if (this.PaymentMode === undefined || this.PaymentMode === null) {
      this.PaymentMode = '';
    }
    if (this.NameOfVATCompany === undefined || this.NameOfVATCompany === null) {
      this.NameOfVATCompany = '';
    }
    if (this.VATTelephone === undefined || this.VATTelephone === null) {
      this.VATTelephone = '';
    }
    if (this.VATBankAddress === undefined || this.VATBankAddress === null) {
      this.VATBankAddress = '';
    }
    if (this.BankAccount === undefined || this.BankAccount === null) {
      this.BankAccount = '';
    }
    if (this.Address === undefined || this.Address === null) {
      this.Address = '';
    }
    if (this.TaxRegistrationAccount === undefined || this.TaxRegistrationAccount === null) {
      this.TaxRegistrationAccount = '';
    }
    if (this.VATRate === undefined || this.VATRate === null) {
      this.VATRate = 0;
    }
    if (this.DepositBank === undefined || this.DepositBank === null) {
      this.DepositBank = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.SupplierType === undefined || this.SupplierType === null) {
      this.SupplierType = SupplierType.正式;
    }
    if (this.AccountingPeriod === undefined || this.AccountingPeriod === null) {
      this.AccountingPeriod = 0;
    }
    if (this.WrittenOffNotReceived === undefined || this.WrittenOffNotReceived === null) {
      this.WrittenOffNotReceived = 0;
    }
    if (this.WrittenOffNotReceivedBeforeTheCreditPeriod === undefined || this.WrittenOffNotReceivedBeforeTheCreditPeriod === null) {
      this.WrittenOffNotReceivedBeforeTheCreditPeriod = 0;
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SupplierModifyDocument.cs
export class SupplierModifyDocument extends DocumentBase implements IUniversalModifyDocument {
  Departmentid!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Departmentid === undefined || this.Departmentid === null) {
      this.Departmentid = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/ARAP/SupplierOpeningAccounts.cs
export class SupplierOpeningAccounts extends EntityBase implements IEnabled, IHasSupplier {
  Supplierid!: number;
  EffectiveTime!: string | null;
  OpeningAccounts!: number;
  EnabledTime!: string | null;
  EnabledByUserid!: number | null;
  IsEnabled!: boolean;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Supplierid === undefined || this.Supplierid === null) {
      this.Supplierid = 0;
    }
    if (this.OpeningAccounts === undefined || this.OpeningAccounts === null) {
      this.OpeningAccounts = 0;
    }
    if (this.IsEnabled === undefined || this.IsEnabled === null) {
      this.IsEnabled = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysField.cs
export class SysField extends EntityBase {
  SysTypeid!: number;
  Name!: string;
  AnotherName!: string;
  RuleValue!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.SysTypeid === undefined || this.SysTypeid === null) {
      this.SysTypeid = 0;
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.AnotherName === undefined || this.AnotherName === null) {
      this.AnotherName = '';
    }
    if (this.RuleValue === undefined || this.RuleValue === null) {
      this.RuleValue = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysModule.cs
export class SysModule extends EntityBase {
  Name!: string;
  PageName!: string;
  AssociatedFeature!: AssociatedFeature;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.PageName === undefined || this.PageName === null) {
      this.PageName = '';
    }
    if (this.AssociatedFeature === undefined || this.AssociatedFeature === null) {
      this.AssociatedFeature = AssociatedFeature.不会因为我存在而拦截上游反审批 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysModuleObject.cs
export class SysModuleObject extends GeneralEntityBase {
  Name!: string;
  IconStyleExpression!: string;
  PageName!: string;
  CanShowInTree!: boolean;
  CanShowInDesktop!: boolean;
  PointXForDesktop!: number;
  PointYForDesktop!: number;
  AssociatedFeature!: AssociatedFeature;
  PageMode!: PageVersionType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IconStyleExpression === undefined || this.IconStyleExpression === null) {
      this.IconStyleExpression = '';
    }
    if (this.PageName === undefined || this.PageName === null) {
      this.PageName = '';
    }
    if (this.CanShowInTree === undefined || this.CanShowInTree === null) {
      this.CanShowInTree = false;
    }
    if (this.CanShowInDesktop === undefined || this.CanShowInDesktop === null) {
      this.CanShowInDesktop = false;
    }
    if (this.PointXForDesktop === undefined || this.PointXForDesktop === null) {
      this.PointXForDesktop = 0;
    }
    if (this.PointYForDesktop === undefined || this.PointYForDesktop === null) {
      this.PointYForDesktop = 0;
    }
    if (this.AssociatedFeature === undefined || this.AssociatedFeature === null) {
      this.AssociatedFeature = AssociatedFeature.不会因为我存在而拦截上游反审批 ;
    }
    if (this.PageMode === undefined || this.PageMode === null) {
      this.PageMode = PageVersionType.Old;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysPage.cs
export class SysPage extends EntityBase {
  Title!: string;
  PageName!: string;
  PageUsage!: PageUsage;
  PageMainTypeBelongTo!: PageMainTypeBelongTo;
  ViewModelTypeName!: string;
  MainTypeName!: string;
  DefaultOrderMemberPath!: string;
  IsDefaultOrderDescending!: boolean;
  SysPageBehavior!: SysPageBehavior;
  AssociatedFeature!: AssociatedFeature;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Title === undefined || this.Title === null) {
      this.Title = '';
    }
    if (this.PageName === undefined || this.PageName === null) {
      this.PageName = '';
    }
    if (this.PageUsage === undefined || this.PageUsage === null) {
      this.PageUsage = PageUsage.Undefined;
    }
    if (this.PageMainTypeBelongTo === undefined || this.PageMainTypeBelongTo === null) {
      this.PageMainTypeBelongTo = PageMainTypeBelongTo.Undefined;
    }
    if (this.ViewModelTypeName === undefined || this.ViewModelTypeName === null) {
      this.ViewModelTypeName = '';
    }
    if (this.MainTypeName === undefined || this.MainTypeName === null) {
      this.MainTypeName = '';
    }
    if (this.DefaultOrderMemberPath === undefined || this.DefaultOrderMemberPath === null) {
      this.DefaultOrderMemberPath = '';
    }
    if (this.IsDefaultOrderDescending === undefined || this.IsDefaultOrderDescending === null) {
      this.IsDefaultOrderDescending = false;
    }
    if (this.SysPageBehavior === undefined || this.SysPageBehavior === null) {
      this.SysPageBehavior = SysPageBehavior.CanMultipleExist ;
    }
    if (this.AssociatedFeature === undefined || this.AssociatedFeature === null) {
      this.AssociatedFeature = AssociatedFeature.不会因为我存在而拦截上游反审批 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysPageField.cs
export class SysPageField extends EntityBase implements IUserInterface {
  OwnerName!: string;
  UserInterfaceType!: UserInterfaceType;
  Width!: number;
  MinWidth!: number;
  MaxWidth!: number;
  BeforeName!: string;
  DisplayName!: string;
  Bindings!: string;
  GroupName!: string;
  ViewFieldBehavior!: ViewFieldBehavior;
  Parameters!: string;
  WidthInComboBox!: number;
  LocationInComboBox!: number;
  OtherOptionForSystemSetting!: OtherOptionForSystemSetting;
  PermissionsGroup!: IntValue;
  PermissionsBit!: IntValue;
  BindingsObj!: any;
  ParametersObj!: any;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.OwnerName === undefined || this.OwnerName === null) {
      this.OwnerName = '';
    }
    if (this.UserInterfaceType === undefined || this.UserInterfaceType === null) {
      this.UserInterfaceType = UserInterfaceType.Unknown;
    }
    if (this.Width === undefined || this.Width === null) {
      this.Width = 0;
    }
    if (this.MinWidth === undefined || this.MinWidth === null) {
      this.MinWidth = 0;
    }
    if (this.MaxWidth === undefined || this.MaxWidth === null) {
      this.MaxWidth = 0;
    }
    if (this.BeforeName === undefined || this.BeforeName === null) {
      this.BeforeName = '';
    }
    if (this.DisplayName === undefined || this.DisplayName === null) {
      this.DisplayName = '';
    }
    if (this.Bindings === undefined || this.Bindings === null) {
      this.Bindings = '';
    }
    if (this.GroupName === undefined || this.GroupName === null) {
      this.GroupName = '';
    }
    if (this.ViewFieldBehavior === undefined || this.ViewFieldBehavior === null) {
      this.ViewFieldBehavior = ViewFieldBehavior.IsMainField ;
    }
    if (this.Parameters === undefined || this.Parameters === null) {
      this.Parameters = '';
    }
    if (this.WidthInComboBox === undefined || this.WidthInComboBox === null) {
      this.WidthInComboBox = 0;
    }
    if (this.LocationInComboBox === undefined || this.LocationInComboBox === null) {
      this.LocationInComboBox = 0;
    }
    if (this.OtherOptionForSystemSetting === undefined || this.OtherOptionForSystemSetting === null) {
      this.OtherOptionForSystemSetting = OtherOptionForSystemSetting.升级账套时保留此设置 ;
    }
    if (this.PermissionsGroup === undefined || this.PermissionsGroup === null) {
      this.PermissionsGroup = IntValue._0 ;
    }
    if (this.PermissionsBit === undefined || this.PermissionsBit === null) {
      this.PermissionsBit = IntValue._0 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysPageHeadUserInterface.cs
export class SysPageHeadUserInterface extends EntityBase implements IUserInterface {
  OwnerName!: string;
  UserInterfaceType!: UserInterfaceType;
  Width!: number;
  Height!: number;
  MinWidth!: number;
  MaxWidth!: number;
  MinHeight!: number;
  MaxHeight!: number;
  MainControlWidth!: number;
  BeforeName!: string;
  DisplayName!: string;
  Bindings!: string;
  ViewFieldBehavior!: ViewFieldBehavior;
  Parameters!: string;
  X!: number;
  Y!: number;
  OtherOptionForSystemSetting!: OtherOptionForSystemSetting;
  BindingsObj!: any;
  ParametersObj!: any;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.OwnerName === undefined || this.OwnerName === null) {
      this.OwnerName = '';
    }
    if (this.UserInterfaceType === undefined || this.UserInterfaceType === null) {
      this.UserInterfaceType = UserInterfaceType.Unknown;
    }
    if (this.Width === undefined || this.Width === null) {
      this.Width = 0;
    }
    if (this.Height === undefined || this.Height === null) {
      this.Height = 0;
    }
    if (this.MinWidth === undefined || this.MinWidth === null) {
      this.MinWidth = 0;
    }
    if (this.MaxWidth === undefined || this.MaxWidth === null) {
      this.MaxWidth = 0;
    }
    if (this.MinHeight === undefined || this.MinHeight === null) {
      this.MinHeight = 0;
    }
    if (this.MaxHeight === undefined || this.MaxHeight === null) {
      this.MaxHeight = 0;
    }
    if (this.MainControlWidth === undefined || this.MainControlWidth === null) {
      this.MainControlWidth = 0;
    }
    if (this.BeforeName === undefined || this.BeforeName === null) {
      this.BeforeName = '';
    }
    if (this.DisplayName === undefined || this.DisplayName === null) {
      this.DisplayName = '';
    }
    if (this.Bindings === undefined || this.Bindings === null) {
      this.Bindings = '';
    }
    if (this.ViewFieldBehavior === undefined || this.ViewFieldBehavior === null) {
      this.ViewFieldBehavior = ViewFieldBehavior.IsMainField ;
    }
    if (this.Parameters === undefined || this.Parameters === null) {
      this.Parameters = '';
    }
    if (this.X === undefined || this.X === null) {
      this.X = 0;
    }
    if (this.Y === undefined || this.Y === null) {
      this.Y = 0;
    }
    if (this.OtherOptionForSystemSetting === undefined || this.OtherOptionForSystemSetting === null) {
      this.OtherOptionForSystemSetting = OtherOptionForSystemSetting.升级账套时保留此设置 ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysType.cs
export class SysType extends EntityBase {
  Name!: string;
  AnotherName!: string;
  TypeSetting!: TypeSetting;
  AssociatedGroup!: number;
  AssociatedFeature!: AssociatedFeature;
  OtherOptionForSystemSetting!: OtherOptionForSystemSetting;
  MutexGroup!: MutexGroup;
  Fields!: SysField[];
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.AnotherName === undefined || this.AnotherName === null) {
      this.AnotherName = '';
    }
    if (this.TypeSetting === undefined || this.TypeSetting === null) {
      this.TypeSetting = TypeSetting.Normal ;
    }
    if (this.AssociatedGroup === undefined || this.AssociatedGroup === null) {
      this.AssociatedGroup = 0;
    }
    if (this.AssociatedFeature === undefined || this.AssociatedFeature === null) {
      this.AssociatedFeature = AssociatedFeature.不会因为我存在而拦截上游反审批 ;
    }
    if (this.OtherOptionForSystemSetting === undefined || this.OtherOptionForSystemSetting === null) {
      this.OtherOptionForSystemSetting = OtherOptionForSystemSetting.升级账套时保留此设置 ;
    }
    if (this.MutexGroup === undefined || this.MutexGroup === null) {
      this.MutexGroup = MutexGroup.A ;
    }
    if (this.Fields === undefined || this.Fields === null) {
      this.Fields = [];
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/SystemMaintenance/SysUseDataRegionInPage.cs
export class SysUseDataRegionInPage extends EntityBase {
  OwnerName!: string;
  DataRegionType!: DataRegionType;
  ControlGeneralLocation!: ControlGeneralLocation;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.OwnerName === undefined || this.OwnerName === null) {
      this.OwnerName = '';
    }
    if (this.DataRegionType === undefined || this.DataRegionType === null) {
      this.DataRegionType = DataRegionType.SecondaryDataRegion ;
    }
    if (this.ControlGeneralLocation === undefined || this.ControlGeneralLocation === null) {
      this.ControlGeneralLocation = ControlGeneralLocation.Center;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/TypeOfInsurance.cs
export class TypeOfInsurance extends GeneralEntityBase {
  Name!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Craft/TypeofWork.cs
export class TypeofWork extends GeneralEntityBase implements ICode, IPause {
  Code!: string;
  Name!: string;
  Content!: string;
  WorkRequirements!: string;
  WorkPriceBase!: number;
  WorkPrice!: number;
  Workshopid!: number;
  ProcessType!: ProcessType;
  SpecialDocumentTableName!: string;
  Level!: string;
  Equipment!: string;
  Levelid!: number;
  Equipmentid!: number;
  WorkingHourMode!: WorkingHourMode;
  TimeSpan!: number | null;
  Note!: string;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Content === undefined || this.Content === null) {
      this.Content = '';
    }
    if (this.WorkRequirements === undefined || this.WorkRequirements === null) {
      this.WorkRequirements = '';
    }
    if (this.WorkPriceBase === undefined || this.WorkPriceBase === null) {
      this.WorkPriceBase = 0;
    }
    if (this.WorkPrice === undefined || this.WorkPrice === null) {
      this.WorkPrice = 0;
    }
    if (this.Workshopid === undefined || this.Workshopid === null) {
      this.Workshopid = 0;
    }
    if (this.ProcessType === undefined || this.ProcessType === null) {
      this.ProcessType = ProcessType.特殊单据 ;
    }
    if (this.SpecialDocumentTableName === undefined || this.SpecialDocumentTableName === null) {
      this.SpecialDocumentTableName = '';
    }
    if (this.Level === undefined || this.Level === null) {
      this.Level = '';
    }
    if (this.Equipment === undefined || this.Equipment === null) {
      this.Equipment = '';
    }
    if (this.Levelid === undefined || this.Levelid === null) {
      this.Levelid = 0;
    }
    if (this.Equipmentid === undefined || this.Equipmentid === null) {
      this.Equipmentid = 0;
    }
    if (this.WorkingHourMode === undefined || this.WorkingHourMode === null) {
      this.WorkingHourMode = WorkingHourMode.无 ;
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/Basic/UserRecord.cs
export class UserRecord extends NewRecord {
  CreateTime!: string | null;
  CreateByEmployeeUid!: number | null;
  UpdateTime!: string | null;
  UpdateByEmployeeUid!: number | null;
  DeletedTime!: string | null;
  DeleteByEmployeeUid!: number | null;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/Basic/BillRecord.cs
export class BillRecord extends UserRecord {
  Code!: string;
  BillDate!: string | null;
  Note!: string;
  ApprovalTime!: string | null;
  ApprovalByEmployeeUid!: number | null;
  FinishTime!: string | null;
  FinishByEmployeeUid!: number | null;
  PrintTime!: string | null;
  PrintByEmployeeUid!: number | null;
  PrintCount!: number;
  Status!: BillStatus;
  CodeForScan!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.PrintCount === undefined || this.PrintCount === null) {
      this.PrintCount = 0;
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = BillStatus.未审批 ;
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/Basic/DetailRecord.cs
export class DetailRecord extends UserRecord {
  ApprovalTime!: string | null;
  ApprovalByEmployeeUid!: number | null;
  FinishTime!: string | null;
  FinishByEmployeeUid!: number | null;
  PrintTime!: string | null;
  PrintByEmployeeUid!: number | null;
  PrintCount!: number;
  Status!: BillStatus;
  CodeForScan!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.PrintCount === undefined || this.PrintCount === null) {
      this.PrintCount = 0;
    }
    if (this.Status === undefined || this.Status === null) {
      this.Status = BillStatus.未审批 ;
    }
    if (this.CodeForScan === undefined || this.CodeForScan === null) {
      this.CodeForScan = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/MESEntities/IOTEquipmentConnectInfo.cs
export class IOTEquipmentConnectInfo extends UserRecord implements IConnectForNetwork, IConnectForSerialPort, IConnectForModbus {
  EquipmentUid!: number;
  Name!: string;
  Note!: string;
  OnlineState!: any;
  ConnectType!: ConnectType;
  Address!: string;
  Port!: number;
  PortName!: string;
  BaudRate!: number;
  DataBits!: number;
  StopBits!: StopBits;
  Parity!: Parity;
  StationNumber!: number;
  Slot!: number;
  Rack!: number;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.EquipmentUid === undefined || this.EquipmentUid === null) {
      this.EquipmentUid = 0;
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.ConnectType === undefined || this.ConnectType === null) {
      this.ConnectType = ConnectType.None ;
    }
    if (this.Address === undefined || this.Address === null) {
      this.Address = '';
    }
    if (this.Port === undefined || this.Port === null) {
      this.Port = 0;
    }
    if (this.PortName === undefined || this.PortName === null) {
      this.PortName = '';
    }
    if (this.BaudRate === undefined || this.BaudRate === null) {
      this.BaudRate = 0;
    }
    if (this.DataBits === undefined || this.DataBits === null) {
      this.DataBits = 0;
    }
    if (this.StopBits === undefined || this.StopBits === null) {
      this.StopBits = StopBits.None;
    }
    if (this.Parity === undefined || this.Parity === null) {
      this.Parity = Parity.None;
    }
    if (this.StationNumber === undefined || this.StationNumber === null) {
      this.StationNumber = 0;
    }
    if (this.Slot === undefined || this.Slot === null) {
      this.Slot = 0;
    }
    if (this.Rack === undefined || this.Rack === null) {
      this.Rack = 0;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/MESEntities/IOTEquipmentParameter.cs
export class IOTEquipmentParameter extends UserRecord {
  ConnectUid!: number;
  Name!: string;
  Note!: string;
  FunctionCode!: number;
  OperationAddress!: string;
  ValueType!: any;
  MonitorTimeSpan!: number;
  MonitorMode!: MonitorMode;
  AllowMinValue!: string;
  AllowMaxValue!: string;
  StartInitValue!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.ConnectUid === undefined || this.ConnectUid === null) {
      this.ConnectUid = 0;
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.FunctionCode === undefined || this.FunctionCode === null) {
      this.FunctionCode = 0;
    }
    if (this.OperationAddress === undefined || this.OperationAddress === null) {
      this.OperationAddress = '';
    }
    if (this.MonitorTimeSpan === undefined || this.MonitorTimeSpan === null) {
      this.MonitorTimeSpan = 0;
    }
    if (this.MonitorMode === undefined || this.MonitorMode === null) {
      this.MonitorMode = MonitorMode.None;
    }
    if (this.AllowMinValue === undefined || this.AllowMinValue === null) {
      this.AllowMinValue = '';
    }
    if (this.AllowMaxValue === undefined || this.AllowMaxValue === null) {
      this.AllowMaxValue = '';
    }
    if (this.StartInitValue === undefined || this.StartInitValue === null) {
      this.StartInitValue = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemDictionary.cs
export class SystemDictionary extends UserRecord implements INameRecord {
  ParentUid!: number | null;
  Name!: string;
  Note!: string;
  ValueType!: CSharpType;
  Value!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.Note === undefined || this.Note === null) {
      this.Note = '';
    }
    if (this.ValueType === undefined || this.ValueType === null) {
      this.ValueType = CSharpType.None ;
    }
    if (this.Value === undefined || this.Value === null) {
      this.Value = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemGenerateRule.cs
export class SystemGenerateRule extends UserRecord {
  DataSourceTableName!: string;
  GenerateTargetTableName!: string;
  UseField!: string;
  GenerateField!: string;
  RelatedField!: string;
  GenerateMode!: GenerateMode;
  QuantityControlMode!: QuantityControlMode;
  IsGetFromOther!: boolean;
  GetFromWhereTableName!: string;
  GetFromWhereFieldName!: string;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.DataSourceTableName === undefined || this.DataSourceTableName === null) {
      this.DataSourceTableName = '';
    }
    if (this.GenerateTargetTableName === undefined || this.GenerateTargetTableName === null) {
      this.GenerateTargetTableName = '';
    }
    if (this.UseField === undefined || this.UseField === null) {
      this.UseField = '';
    }
    if (this.GenerateField === undefined || this.GenerateField === null) {
      this.GenerateField = '';
    }
    if (this.RelatedField === undefined || this.RelatedField === null) {
      this.RelatedField = '';
    }
    if (this.QuantityControlMode === undefined || this.QuantityControlMode === null) {
      this.QuantityControlMode = QuantityControlMode.不控制 ;
    }
    if (this.IsGetFromOther === undefined || this.IsGetFromOther === null) {
      this.IsGetFromOther = false;
    }
    if (this.GetFromWhereTableName === undefined || this.GetFromWhereTableName === null) {
      this.GetFromWhereTableName = '';
    }
    if (this.GetFromWhereFieldName === undefined || this.GetFromWhereFieldName === null) {
      this.GetFromWhereFieldName = '';
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/EntityFrameworkCore/ERPServer/Warehouse.cs
export class Warehouse extends GeneralEntityBase implements ICode, IPause {
  Code!: string;
  Name!: string;
  IsVirtual!: boolean;
  IsPause!: boolean;
  PauseTime!: string | null;
  PauseByUserid!: number | null;
  WarehouseType!: WarehouseType;
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
    if (typeof super.initDefaults === "function") {
      super.initDefaults();
    }
    if (this.Code === undefined || this.Code === null) {
      this.Code = '';
    }
    if (this.Name === undefined || this.Name === null) {
      this.Name = '';
    }
    if (this.IsVirtual === undefined || this.IsVirtual === null) {
      this.IsVirtual = false;
    }
    if (this.IsPause === undefined || this.IsPause === null) {
      this.IsPause = false;
    }
    if (this.WarehouseType === undefined || this.WarehouseType === null) {
      this.WarehouseType = WarehouseType.Ordinary ;
    }
  }
}

// 来自: ../ERP_csharp/ERP.Db/Iterate2024/Entities/SystemEntities/SystemRangeRoleDetail.cs
export class WhereConditionList {
  /**
   * 初始化所有非空属性的默认值。
   */
  initDefaults(): void {
  }
}
