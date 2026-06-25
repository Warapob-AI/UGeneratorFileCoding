// Utility functions for string casing
export function toPascalCase(str: string): string {
  if (!str) return '';
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase()).replace(/[\s\-_]+/g, '');
}

export function toCamelCase(str: string): string {
  if (!str) return '';
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toSnakeCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\s\-]+/g, '_')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/_+/g, '_')
    .toUpperCase();
}

export function toKebabCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function getDefaultLabel(name: string): string {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lower.endsWith('tolabel') || lower.endsWith('to label') || lower.endsWith('to')) {
    return 'To';
  }
  return toPascalCase(name).replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function findMatchingFromField(fieldName: string, allFields: FieldDefinition[]): string | undefined {
  if (!fieldName) return undefined;

  const lower = fieldName.toLowerCase();
  let prefix = '';

  // ตรวจสอบ Suffix และ Slice ความยาวตามจริง (to = 2 ตัวอักษร, ถึง = 3 ตัวอักษร)
  if (lower.endsWith('to')) {
    prefix = fieldName.slice(0, -2);
  } else if (lower.endsWith('ถึง')) {
    prefix = fieldName.slice(0, -3);
  } else {
    return undefined;
  }

  // เตรียมคำค้นหาที่เป็นไปได้ในรูปแบบตัวพิมพ์เล็ก (Lowercase)
  const targetFromLower = (prefix + 'from').toLowerCase();
  const targetStartLower = (prefix + 'ตั้งแต่').toLowerCase();

  // ค้นหาฟิลด์ที่มีชื่อตรงกับเงื่อนไข
  const matching = allFields.find(f => {
    const fLower = f.name.toLowerCase();
    return fLower === targetFromLower || fLower === targetStartLower;
  });

  return matching?.name;
}
export function findMatchingToField(fieldName: string, allFields: FieldDefinition[]): string | undefined {
  const lower = fieldName.toLowerCase();
  if (lower.endsWith('from')) {
    const prefix = fieldName.slice(0, -4);
    const matching = allFields.find(f => {
      const fLower = f.name.toLowerCase();
      return fLower === (prefix + 'to').toLowerCase() || fLower === (prefix + 'To').toLowerCase();
    });
    return matching?.name;
  }
  return undefined;
}

export interface FieldDefinition {
  name: string;
  type: string; // 'String' | 'Integer' | 'Long' | 'Double' | 'BigDecimal' | 'LocalDate' | 'Boolean'
  frontendType?: string; // 'text' | 'number' | 'calendar' | 'checkbox' | 'select' | 'radio'
  columnName: string;
  isKey: boolean;
  label?: string;
  isRequired?: boolean;
  maxLength?: number;
  disable?: boolean; // ข้อที่ 1: เพิ่ม property สำหรับการสั่งปิดควบคุม Component หน้าบ้าน
}

export interface ButtonsSelection {
  search: boolean;
  clear: boolean;
  save: boolean;
  close: boolean;
  add: boolean;
  print: boolean;
  printPdf: boolean;
  printExcel: boolean;
}

export interface GeneratorOptions {
  hasDealerSearch?: boolean;      // ข้อที่ 2: เลือกว่าเปิดระบบค้นหา Dealer Popup หรือไม่
  useSearchStore?: boolean;       // ข้อที่ 4: เลือกว่าจะเอา Zustand Store หรือไม่
  programId?: string;             // ข้อที่ 5: รหัสโปรแกรม เช่น COPR07
  legacyUrl?: string;             // ข้อที่ 5: URL Struts เดิม เช่น /COPR07InterestSubsidyReport.do
  routingPath?: string;           // ข้อที่ 5: path หน้าบ้านใหม่ เช่น /interestSubsidyReport
  roleCode?: string;              // ข้อที่ 5: สิทธิ์ระบบงาน เช่น SKL-IT-ASS
}

// Maps Java types to TypeScript types
export function mapJavaTypeToTs(javaType: string): string {
  switch (javaType) {
    case 'String': return 'string';
    case 'Integer':
    case 'Long':
    case 'Double':
    case 'BigDecimal': return 'number';
    case 'LocalDate': return 'Date';
    case 'Boolean': return 'boolean';
    default: return 'any';
  }
}

// Generate DTOs
export interface GeneratedDTOs {
  createRequest: string;
  updateRequest: string;
  response: string;
  searchRequest: string;
}

export function generateBackendDTOs(moduleName: string, moduleType: string, fields: FieldDefinition[]): GeneratedDTOs {
  if (!fields || fields.length === 0) {
    return {
      createRequest: '// Add at least one field to generate code.',
      updateRequest: '// Add at least one field to generate code.',
      response: '// Add at least one field to generate code.',
      searchRequest: '// Add at least one field to generate code.'
    };
  }
  const pascalName = toPascalCase(moduleName);
  const packageName = `com.gable.um.${moduleType.toLowerCase()}.dto`;
  const generateJavaFields = (fieldList: FieldDefinition[]) => {
    return fieldList.map(f => `    private ${f.type} ${f.name};`).join('\n');
  };
  const createFields = generateJavaFields(fields);
  const createRequest = `package ${packageName};\nimport lombok.*;\nimport java.time.LocalDate;\nimport java.math.BigDecimal;\n@Getter\n@Setter\n@Builder\n@AllArgsConstructor\n@NoArgsConstructor\npublic class ${pascalName}CreateRequest {\n${createFields}\n}\n`;
  const nonKeyFields = fields.filter(f => !f.isKey);
  const updateFieldsStr = generateJavaFields(nonKeyFields.length > 0 ? nonKeyFields : fields);
  const updateRequest = `package ${packageName};\nimport lombok.*;\nimport java.time.LocalDate;\nimport java.math.BigDecimal;\n@Getter\n@Setter\n@Builder\n@AllArgsConstructor\n@NoArgsConstructor\npublic class ${pascalName}UpdateRequest {\n${updateFieldsStr}\n}\n`;
  const responseFields = fields.map(f => `    private ${f.type} ${f.name};`).join('\n');
  const response = `package ${packageName};\nimport lombok.*;\nimport java.time.LocalDate;\nimport java.math.BigDecimal;\n@Getter\n@Setter\n@Builder\n@AllArgsConstructor\n@NoArgsConstructor\npublic class ${pascalName}Response {\n${responseFields}\n}\n`;
  const searchFields = generateJavaFields(fields);
  const searchRequest = `package ${packageName};\nimport lombok.*;\nimport java.time.LocalDate;\nimport java.math.BigDecimal;\n@Getter\n@Setter\n@Builder\n@AllArgsConstructor\n@NoArgsConstructor\npublic class ${pascalName}SearchRequest {\n${searchFields}\n}\n`;
  return { createRequest, updateRequest, response, searchRequest };
}

export function generateBackendModel(moduleName: string, moduleType: string, tableName: string, className: string, fields: FieldDefinition[]): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const packageName = `com.gable.um.${moduleType.toLowerCase()}.model`;
  const table = tableName || `MK_${toSnakeCase(moduleName)}`;
  const finalClassName = className || `Mk${toPascalCase(moduleName)}`;
  const classFields = fields.map(f => {
    let annotations = f.isKey ? '    @Id\n' : '';
    annotations += `    @Column(name = "${f.columnName || toSnakeCase(f.name)}")`;
    return `${annotations}\n    private ${f.type} ${f.name};`;
  }).join('\n\n');
  return `package ${packageName};\nimport jakarta.persistence.*;\nimport lombok.*;\nimport java.time.LocalDate;\nimport java.math.BigDecimal;\n@Entity\n@Getter\n@Setter\n@Builder\n@AllArgsConstructor\n@NoArgsConstructor\n@Table(name = "${table}")\npublic class ${finalClassName} {\n${classFields}\n}\n`;
}

export function generateBackendController(moduleName: string, moduleType: string, className: string, fields: FieldDefinition[]): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  return `package com.gable.um.${typeLower}.controller;\nimport com.gable.um.${typeLower}.service.${pascalName}Service;\nimport lombok.RequiredArgsConstructor;\nimport lombok.extern.slf4j.Slf4j;\nimport org.springframework.web.bind.annotation.*;\n@Slf4j\n@RestController\n@RequiredArgsConstructor\n@RequestMapping("/${typeLower}/${camelName}")\npublic class ${pascalName}Controller {\n    private final ${pascalName}Service ${camelName}Service;\n}\n`;
}

export function generateBackendRepository(moduleName: string, moduleType: string, className: string, fields: FieldDefinition[]): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const finalClassName = className || `Mk${pascalName}`;
  const keyField = fields.find(f => f.isKey) || fields[0];
  return `package com.gable.um.${typeLower}.repository;\nimport com.gable.um.${typeLower}.model.${finalClassName};\nimport org.springframework.context.annotation.Profile;\nimport org.springframework.data.jpa.repository.JpaRepository;\nimport org.springframework.stereotype.Repository;\n@Profile("oracle")\n@Repository\npublic interface ${pascalName}Repository extends JpaRepository<${finalClassName}, ${keyField ? keyField.type : 'String'}>, ${pascalName}RepositoryCustom {\n}\n`;
}

export function generateBackendRepositoryCustom(moduleName: string, moduleType: string, className: string, fields: FieldDefinition[]): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  return `package com.gable.um.${typeLower}.repository;\nimport com.gable.um.${typeLower}.dto.${pascalName}Response;\nimport com.gable.um.${typeLower}.dto.${pascalName}SearchRequest;\nimport java.util.List;\npublic interface ${pascalName}RepositoryCustom {\n    List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request);\n}\n`;
}

export function generateBackendRepositoryCustomImpl(moduleName: string, moduleType: string, tableName: string, className: string, fields: FieldDefinition[]): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const table = tableName || `MK_${toSnakeCase(moduleName)}`;
  const selectColumns = fields.map(f => f.columnName || toSnakeCase(f.name)).join(', ');
  const queryConditions = fields.map(f => {
    const col = f.columnName || toSnakeCase(f.name);
    return f.type === 'String'
      ? `        if (org.apache.commons.lang3.StringUtils.isNotEmpty(request.get${toPascalCase(f.name)}())) {\n            sql.append(" AND UPPER(${col}) LIKE :${f.name} ESCAPE '\\\\' ");\n            params.put("${f.name}", "%" + escapeLike(request.get${toPascalCase(f.name)}().toUpperCase()) + "%");\n        }`
      : `        if (request.get${toPascalCase(f.name)}() != null) {\n            sql.append(" AND ${col} = :${f.name} ");\n            params.put("${f.name}", request.get${toPascalCase(f.name)}());\n        }`;
  }).join('\n');
  const resultMapperFields = fields.map(f => {
    let getter = f.type === 'Integer' ? 'getInt' : f.type === 'Long' ? 'getLong' : f.type === 'Double' ? 'getDouble' : f.type === 'BigDecimal' ? 'getBigDecimal' : 'getString';
    return f.type === 'LocalDate'
      ? `                        .${f.name}(rs.getDate("${f.columnName || toSnakeCase(f.name)}") != null ? rs.getDate("${f.columnName || toSnakeCase(f.name)}").toLocalDate() : null)`
      : `                        .${f.name}(rs.get${toPascalCase(getter)}("${f.columnName || toSnakeCase(f.name)}"))`;
  }).join('\n');
  return `package com.gable.um.${typeLower}.repository;\nimport com.gable.um.${typeLower}.dto.*;\nimport lombok.RequiredArgsConstructor;\nimport org.springframework.context.annotation.Profile;\nimport org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;\nimport org.springframework.stereotype.Repository;\nimport java.util.*;\n@Profile("oracle")\n@Repository\n@RequiredArgsConstructor\npublic class ${pascalName}RepositoryCustomImpl implements ${pascalName}RepositoryCustom {\n    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;\n    private String escapeLike(String value) { return value == null ? null : value.replace("_", "\\\\_"); }\n    @Override\n    public List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request) {\n        Map<String, Object> params = new HashMap<>();\n        StringBuilder sql = new StringBuilder("SELECT ${selectColumns} FROM ${table} WHERE 1=1 ");\n${queryConditions}\n        return namedParameterJdbcTemplate.query(sql.toString(), params, (rs, rowNum) ->\n                ${pascalName}Response.builder()\n${resultMapperFields}\n                        .build()\n        );\n    }\n}\n`;
}

export function generateBackendService(moduleName: string, moduleType: string, className: string, fields: FieldDefinition[]): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const keyField = fields.find(f => f.isKey) || fields[0];
  return `package com.gable.um.${typeLower}.service;\nimport com.gable.um.${typeLower}.dto.*;\nimport java.util.List;\npublic interface ${pascalName}Service {\n    List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request);\n    ${pascalName}Response get${pascalName}ById(${keyField ? keyField.type : 'String'} id);\n    void create${pascalName}(${pascalName}CreateRequest request, String userId);\n    void update${pascalName}(${keyField ? keyField.type : 'String'} id, ${pascalName}UpdateRequest request, String userId);\n    void delete${pascalName}(${keyField ? keyField.type : 'String'} id, String userId);\n}\n`;
}

export function generateBackendServiceImpl(moduleName: string, moduleType: string, className: string, fields: FieldDefinition[]): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const finalClassName = className || `Mk${pascalName}`;
  const keyField = fields.find(f => f.isKey) || fields[0];
  const entitySetters = fields.map(f => `                .${f.name}(request.get${toPascalCase(f.name)}())`).join('\n');
  const dtoResponseBuilder = fields.map(f => `                        .${f.name}(e.get${toPascalCase(f.name)}())`).join('\n');
  const entityUpdateSetters = fields.filter(f => !f.isKey).map(f => `        entity.set${toPascalCase(f.name)}(request.get${toPascalCase(f.name)}());`).join('\n');
  return `package com.gable.um.${typeLower}.service;\nimport com.gable.um.exception.BusinessException;\nimport com.gable.um.${typeLower}.dto.*;\nimport com.gable.um.${typeLower}.model.${finalClassName};\nimport com.gable.um.${typeLower}.repository.${pascalName}Repository;\nimport lombok.RequiredArgsConstructor;\nimport org.springframework.stereotype.Service;\nimport org.springframework.transaction.annotation.Transactional;\nimport java.util.List;\n@Service\n@RequiredArgsConstructor\n@Transactional\npublic class ${pascalName}ServiceImpl implements ${pascalName}Service {\n    private final ${pascalName}Repository ${camelName}Repository;\n    @Override\n    @Transactional(readOnly = true)\n    public List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request) { return ${camelName}Repository.search${pascalName}(request); }\n    @Override\n    @Transactional(readOnly = true)\n    public ${pascalName}Response get${pascalName}ById(${keyField ? keyField.type : 'String'} id) { return ${camelName}Repository.findById(id).map(e -> ${pascalName}Response.builder()\n${dtoResponseBuilder}\n                .build()).orElse(null); }\n    @Override\n    public void create${pascalName}(${pascalName}CreateRequest request, String userId) {\n        ${finalClassName} entity = ${finalClassName}.builder()\n${entitySetters}\n                .build();\n        ${camelName}Repository.save(entity);\n    }\n    @Override\n    public void update${pascalName}(${keyField ? keyField.type : 'String'} id, ${pascalName}UpdateRequest request, String userId) {\n        ${finalClassName} entity = ${camelName}Repository.findById(id).orElseThrow(() -> new BusinessException("EC003"));\n${entityUpdateSetters}\n        ${camelName}Repository.save(entity);\n    }\n    @Override\n    public void delete${pascalName}(${keyField ? keyField.type : 'String'} id, String userId) {\n        if (!${camelName}Repository.existsById(id)) throw new BusinessException("EC003");\n        ${camelName}Repository.deleteById(id);\n    }\n}\n`;
}

// ============================================================================
// FRONTEND MODELS & SCHEMAS
// ============================================================================

export function generateFrontendModel(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  frontendMode?: 'search' | 'report',
  options?: GeneratorOptions
): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  let finalFields = [...fields];

  if (options?.hasDealerSearch) {
    if (!finalFields.some(f => f.name === 'dealerCode')) finalFields.push({ name: 'dealerCode', type: 'String', columnName: 'DEALER_CODE', isKey: false, label: 'รหัสผู้จำหน่าย' });
    if (!finalFields.some(f => f.name === 'dealerName')) finalFields.push({ name: 'dealerName', type: 'String', columnName: 'DEALER_NAME', isKey: false, label: 'ชื่อผู้จำหน่าย' });
  }

  const modelFieldsStr = finalFields.map(f => `  ${f.name}?: ${mapJavaTypeToTs(f.type)};`).join('\n');
  const fieldsObjectFields = finalFields.map(f => `  ${toSnakeCase(f.name)}: "${f.name}",`).join('\n');

  let code = `export interface ${pascalName}Model {\n${modelFieldsStr}\n}\n\nexport const ${pascalName}ModelFields = {\n${fieldsObjectFields}\n};\n`;
  if (frontendMode !== 'report') {
    const createFieldsStr = finalFields.map(f => `  ${f.name}?: ${mapJavaTypeToTs(f.type)};`).join('\n');
    const updateFieldsStr = finalFields.filter(f => !f.isKey).map(f => `  ${f.name}?: ${mapJavaTypeToTs(f.type)};`).join('\n');
    code += `\nexport interface ${pascalName}CreateModel {\n${createFieldsStr}\n}\n\nexport interface ${pascalName}UpdateModel {\n${updateFieldsStr}\n}\n`;
  }
  return code;
}

export function generateFrontendService(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  isReport: boolean = false,
  options?: GeneratorOptions
): string {
  const camelName = toCamelCase(moduleName);
  const pascalName = toPascalCase(moduleName);
  const typeUpper = moduleType.toUpperCase();
  const typeLower = moduleType.toLowerCase();

  if (isReport) {
    let targetFields = [...fields];
    if (options?.hasDealerSearch) {
      if (!targetFields.some(f => f.name === 'dealerCode')) targetFields.push({ name: 'dealerCode', type: 'String', columnName: 'DEALER_CODE', isKey: false });
      if (!targetFields.some(f => f.name === 'dealerName')) targetFields.push({ name: 'dealerName', type: 'String', columnName: 'DEALER_NAME', isKey: false });
    }
    const mappingParams = targetFields.map(f => f.type === 'LocalDate' ? `      ${f.name}: formatLocalDate(theModel.${f.name}),` : `      ${f.name}: theModel.${f.name},`).join('\n');

    return `import { Constants } from "@/_helpers/constants";\nimport { formatLocalDate } from "@/_helpers/date-helper";\nimport axiosBlob from "@/utils/axiosBlob";\n` +
           `import { ${pascalName}Model } from "@/_models/${typeLower}/${camelName}/${camelName}.model";\n\n` +
           `export const ${typeUpper}_${toSnakeCase(moduleName)}_URL = \`\${Constants.URL_${typeUpper}}/${camelName}\`;\n\n` +
           `function export${pascalName}(theModel: ${pascalName}Model) {\n  return axiosBlob.get(\`\${${typeUpper}_${toSnakeCase(moduleName)}_URL}/exportExcel\`, {\n    params: {\n${mappingParams}\n    },\n  });\n}\n\n` +
           `export const ${camelName}Service = { export${pascalName} };\n`;
  }

  return `import { Constants } from "@/_helpers/constants";\nimport axios from "@/utils/axiosInstance";\n\nexport const ${toSnakeCase(moduleName)}_URL = \`\${Constants.URL_${typeUpper}}/${camelName}\`;\n\nexport const ${camelName}Service = {\n  // Methods\n};\n`;
}

function getZodSchemaField(f: FieldDefinition): string {
  const isReq = f.isRequired ?? false;
  const maxLen = f.maxLength;
  if (f.type === 'String') {
    return maxLen !== undefined && maxLen > 0
      ? `ZodHelper.getStringField(${isReq ? 'true, 1' : 'false, undefined'}, { max: ${maxLen} })`
      : `ZodHelper.getStringField(${isReq ? 'true, 1' : ''})`;
  } else if (f.type === 'Boolean') {
    return `ZodHelper.getStringBooleanCheckboxField(${isReq ? 'true' : ''})`;
  } else if (f.type === 'LocalDate') {
    return `ZodHelper.getPreprocessedDateField(${isReq ? 'true' : ''})`;
  } else {
    return `ZodHelper.toNumber(${isReq ? 'true' : ''})`;
  }
}

export function generateFrontendSearchSchema(moduleName: string, fields: FieldDefinition[]): string {
  const pascalName = toPascalCase(moduleName);
  const zodFields = fields.map(f => `  ${f.name}: ${getZodSchemaField(f)}`).join(',\n');
  const defaults = fields.map(f => f.type === 'Boolean' ? `  ${f.name}: "N"` : f.type === 'LocalDate' ? `  ${f.name}: undefined` : `  ${f.name}: ""`).join(',\n');
  return `import { ZodHelper } from "@/_helpers/zod-helper";\nimport { z } from "zod";\n\nexport const ${pascalName}SearchSchema = z.object({\n${zodFields}\n});\n\nexport const default${pascalName}SearchValues = {\n${defaults}\n};\n`;
}

export function generateFrontendSearchTable(moduleName: string, moduleType: string, fields: FieldDefinition[]): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const columnsDef = fields.map(f => f.type === 'LocalDate' ? `          constructDateColumn({\n            accessorKey: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n            header: "${f.label || getDefaultLabel(f.name)}",\n          })` : `          {\n            accessorKey: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n            header: "${f.label || getDefaultLabel(f.name)}",\n          }`).join(',\n');
  return `"use client";\nimport { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}.model";\nimport { constructDateColumn } from "@/components/layout/Form";\nimport { CustomColTool } from "@/components/layout/Table";\nimport { MRT_ColumnDef } from "material-react-table";\nimport { useMemo } from "react";\nexport const ${pascalName}TableColumns = {\n  GetColumns: (editAction: (data: ${pascalName}Model) => void, deleteAction: (data: ${pascalName}Model) => void) => {\n    return useMemo<MRT_ColumnDef<${pascalName}Model>[]>(() => [\n      { accessorKey: "id", header: "No.", Cell: ({ row }) => <div>{row.index + 1}</div>, muiTableBodyCellProps: { align: "center" }, size: 100 },\n      { accessorKey: "tool", header: "Action", Cell: ({ row }) => <CustomColTool goToEditPage={() => editAction(row.original)} goToDeletePage={() => deleteAction(row.original)} isEdit={true} isDelete={true} />, size: 150 },\n${columnsDef}\n    ], [editAction, deleteAction]);\n  }\n};\n`;
}

export function generateFrontendReportSchema(moduleName: string, fields: FieldDefinition[], reportFileName: string): string {
  const finalReportName = reportFileName || (toCamelCase(moduleName) + 'Report');
  const pascalReportName = toPascalCase(finalReportName);
  const zodFields = fields.map(f => `  ${f.name}: ${getZodSchemaField(f)}`).join(',\n');
  const defaults = fields.map(f => f.type === 'Boolean' ? `  ${f.name}: "N"` : f.type === 'LocalDate' ? `  ${f.name}: undefined` : `  ${f.name}: ""`).join(',\n');
  return `import { ZodHelper } from "@/_helpers/zod-helper";\nimport { z } from "zod";\n\nexport const ${pascalReportName}Schema = z.object({\n${zodFields}\n});\n\nexport const default${pascalReportName}Values = {\n${defaults}\n};\n`;
}

export function generateFrontendFormSchema(moduleName: string, fields: FieldDefinition[]): string {
  const pascalName = toPascalCase(moduleName);
  const zodFields = fields.map(f => `  ${f.name}: ${getZodSchemaField(f)}`).join(',\n');
  const defaults = fields.map(f => f.type === 'Boolean' ? `  ${f.name}: "N"` : f.type === 'LocalDate' ? `  ${f.name}: undefined` : `  ${f.name}: ""`).join(',\n');
  return `import { ZodHelper } from "@/_helpers/zod-helper";\nimport { z } from "zod";\n\nexport const ${pascalName}FormSchema = z.object({\n${zodFields}\n});\n\nexport const default${pascalName}FormValues = {\n${defaults}\n};\n`;
}

export function generateFrontendSearchStore(moduleName: string, moduleType: string): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  return `"use client";\n\nimport { create } from "zustand";\nimport { createJSONStorage, persist } from "zustand/middleware";\nimport { ${pascalName}Model } from "@/_models/${typeLower}/${camelName}/${camelName}.model";\nimport { default${pascalName}Values } from "@/components/hpls/${typeLower}/${camelName}/schemas/${camelName}Schema";\n\ninterface ${pascalName}SearchState {\n  searchParams: ${pascalName}Model;\n  setSearchParams: (params: ${pascalName}Model) => void;\n  clearSearchParams: () => void;\n}\nconst initial${pascalName}SearchState: ${pascalName}Model = { ...default${pascalName}Values };\nexport const use${pascalName}SearchStore = create<${pascalName}SearchState>()(\n  persist((set) => ({\n    searchParams: initial${pascalName}SearchState,\n    setSearchParams: (params) => set({ searchParams: params }),\n    clearSearchParams: () => set({ searchParams: initial${pascalName}SearchState }),\n  }), { name: "${camelName}-search-store", storage: createJSONStorage(() => localStorage) })\n);\n`;
}

function getFieldInputTemplate(f: FieldDefinition, pascalName: string): string {
  let label = f.label || getDefaultLabel(f.name);
  const disableSnippet = f.disable ? `,\n      disable: true` : '';
  
  // 1. ตรวจสอบ UI Type จาก frontendType ที่เลือกบนหน้าจอเป็นอันดับแรก ถ้านิ่งสนิทค่อย Fallback ตาม Backend Type
  let uiType = f.frontendType || 'text';
  if (!f.frontendType) {
    if (f.type === 'Boolean') uiType = 'checkbox';
    else if (f.type === 'LocalDate') uiType = 'calendar';
    else if (['Integer', 'Long', 'Double', 'BigDecimal'].includes(f.type)) uiType = 'number';
  }

  // 2. ถ้าเป็น select หรือ radio ให้ปั่นพ่วงอาร์เรย์ options ของโปรเจกต์เข้าไปด้วย
  let optionsSnippet = '';
  if (uiType === 'select' || uiType === 'radio') {
    optionsSnippet = `,\n      options: dropdowns.${toCamelCase(f.name)}Options`;
  }

  // 3. พ่นโครงสร้างอ็อบเจกต์ส่งออกตามประเภท UI
  if (uiType === 'checkbox') {
    return `    {\n      type: 'checkbox',\n      fieldName: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n      label: '${label}'${disableSnippet}\n    }`;
  } else if (uiType === 'calendar') {
    let rangeProps = '';
    if (f.name.toLowerCase().includes('from')) {
      const matchTo = f.name.replace(/from/i, 'To');
      rangeProps = `,\n      maxDate: ${toCamelCase(matchTo)}`;
    } else if (f.name.toLowerCase().includes('to')) {
      const matchFrom = f.name.replace(/to/i, 'From');
      rangeProps = `,\n      minDate: ${toCamelCase(matchFrom)}`;
    }
    return `    {\n      type: 'calendar',\n      fieldName: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n      label: '${label}',\n      isRequired: ${f.isRequired ? 'true' : 'false'}${rangeProps}${disableSnippet}\n    }`;
  } else {
    // รองรับ text, number, select, radio ได้อย่างถูกต้องแม่นยำตามที่เลือกบน UI
    return `    {\n      type: '${uiType}',\n      fieldName: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n      label: '${label}'${optionsSnippet}${disableSnippet}\n    }`;
  }
}

function getDealerFieldsTemplate(pascalName: string): string {
  return `    {\n      type: 'text',\n      fieldName: ${pascalName}ModelFields.DEALER_CODE,\n      label: 'รหัส Dealer',\n      maxLength: 20,\n      onBlur: (value: string) => handleDealerBlur(value),\n      button: {\n        labelId: 'BUTTON.SEARCH',\n        type: 'button',\n        text: '',\n        showButton: true,\n        onClick: () => setDealerPopup(true),\n      } as ButtonConfig,\n    },\n` +
         `    {\n      type: 'text',\n      fieldName: ${pascalName}ModelFields.DEALER_NAME,\n      label: ' ',\n      disable: true,\n      maxLength: 200,\n    }`;
}

export function generateFrontendDetailComponent(moduleName: string, moduleType: string, fields: FieldDefinition[], buttons: ButtonsSelection): string {
  const pascalName = toPascalCase(moduleName);
  return `"use client";\nimport { useForm } from "react-hook-form";\nimport { CustomDialog } from "@/components/layout/Form/CustomDialog";\nimport DynamicForm from "@/components/layout/Form/dynamic-form-builder";\nimport BoxContainer from "@/components/ui/box-container";\n\nconst ${pascalName}FormModal = ({ open, setOpen }: any) => {\n  const modalForm = useForm();\n  return (\n    <CustomDialog open={open} onOpenChange={setOpen} title="ข้อมูล" size="lg">\n      <BoxContainer variant="compact">\n        <DynamicForm inputFormControl={modalForm} formId="modalForm" fields={[]} columnsNo="1" />\n      </BoxContainer>\n    </CustomDialog>\n  );\n};\nexport default ${pascalName}FormModal;\n`;
}

// ============================================================================
// 🔥 2. FRONTEND SEARCH VIEW COMPONENT GENERATOR (จัดทัพโครงสร้างตัวแปรและลำดับตรงเป๊ะ)
// ============================================================================
export function generateFrontendSearchComponent(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  buttons: ButtonsSelection,
  pageHeader?: string,
  options?: GeneratorOptions
): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();

  // ดึงกลุ่ม .watch ออกมาเตรียมประกาศไว้ภายนอกก่อนถึง Dynamic Fields
  const dateFields = fields.filter(f => f.type === 'LocalDate' || f.frontendType === 'calendar');
  const watchLines = dateFields.map(f => `  const ${f.name} = searchForm.watch(${pascalName}ModelFields.${toSnakeCase(f.name)});`).join('\n');

  let inputsStr = fields.map(f => getFieldInputTemplate(f, pascalName)).join(',\n');
  if (options?.hasDealerSearch) {
    inputsStr = getDealerFieldsTemplate(pascalName) + (inputsStr ? ",\n" + inputsStr : "");
  }

  // ตัวเลือกโครงสร้าง Zustand Store
  let storeImport = options?.useSearchStore ? `import { use${pascalName}SearchStore } from "@/_providers/${typeLower}/${camelName}/${camelName}SearchStore.provider";\n` : '';
  let storeHooks = options?.useSearchStore ? 
    `  const searchParams = use${pascalName}SearchStore((s) => s.searchParams);\n` +
    `  const setSearchParams = use${pascalName}SearchStore((s) => s.setSearchParams);\n` +
    `  const clearSearchParams = use${pascalName}SearchStore((s) => s.clearSearchParams);\n\n` : '';
    
  let storeEffect = options?.useSearchStore ? 
    `  useEffect(() => {\n` +
    `    if (searchParams) {\n` +
    `      searchForm.reset({\n` +
    `        ...searchParams,\n` +
    `      });\n` +
    `    }\n` +
    `  }, [searchParams]);\n\n` : '';
  
  return `"use client";\n\n` +
    `// React core\n` +
    `import { useRef, useState, useEffect, useCallback } from "react";\n` +
    `import { useForm } from "react-hook-form";\n\n` +
    `// External libs\n` +
    `import z from "zod";\n` +
    `import { zodResolver } from "@hookform/resolvers/zod";\n\n` +
    `// Layout / UI components\n` +
    `import { CustomCard } from "@/components/layout/Form/Card";\n` +
    `import DynamicForm, { ButtonConfig, DynamicField } from "@/components/layout/Form/dynamic-form-builder";\n` +
    `import BoxContainer from "@/components/ui/box-container";\n\n` +
    `// Shared / feature components\n` +
    `${options?.hasDealerSearch ? `import CoDealerPopUp from "../shared/coDealerPopUp";\n` : ''}` +
    `\n// Services\n` +
    `${options?.hasDealerSearch ? `import { popupCoService } from "@/_service/co/popupCo.service";\n` : ''}` +
    `import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}/${camelName}.service";\n\n` +
    `// Providers / stores\n` +
    `import { useLoading } from "@/_providers/loader-provider";\n` +
    `import { useAlert } from "@/_providers/alert-provider";\n` +
    `${storeImport}\n` +
    `// Helpers / utils\n` +
    `import { FormHelper } from "@/_helpers/form-helper";\n\n` +
    `// Schemas / models\n` +
    `import { ${pascalName}Schema, default${pascalName}Values } from "./schemas/${camelName}Schema";\n` +
    `import { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}/${camelName}.model";\n` +
    `${options?.hasDealerSearch ? `import { PopupCoDealerModel } from "@/_models/co/popupCo.model";\n` : ''}\n` +
    `const header = "${pageHeader || `ค้นหาข้อมูล ${pascalName}`}";\n\n` +
    `const ${pascalName} = () => {\n` +
         (options?.hasDealerSearch ? `  const [dealerPopup, setDealerPopup] = useState<boolean>(false);\n  const [dealerData, setDealerData] = useState<PopupCoDealerModel>({});\n\n  const lastDealerCode = useRef<string>("");\n\n` : '') +
    `  const { errorAlert } = useAlert();\n` +
    `  const loading = useLoading((s) => s.loading);\n` +
    `  const setLoading = useLoading((s) => s.setLoading);\n\n` +
         storeHooks +
    `  const searchForm = useForm<z.infer<typeof ${pascalName}Schema>>({\n` +
    `    resolver: zodResolver(${pascalName}Schema),\n` +
    `    defaultValues: ${options?.useSearchStore ? 'searchParams' : `default${pascalName}Values`},\n` +
    `    mode: "onChange",\n` +
    `  });\n\n` +
         storeEffect +
         (options?.hasDealerSearch ? `  useEffect(() => {\n    if (dealerData?.bpCode) {\n      searchForm.setValue(${pascalName}ModelFields.DEALER_CODE, dealerData.bpCode ?? "");\n      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, dealerData.dealerThaiName ?? "");\n      lastDealerCode.current = dealerData.bpCode ?? "";\n    }\n  }, [dealerData]);\n\n  const handleDealerBlur = useCallback(async (value: string) => {\n    if (!value || value.trim() === "") {\n      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n      lastDealerCode.current = "";\n      return;\n    }\n    if (value === lastDealerCode.current) return;\n    lastDealerCode.current = value;\n    try {\n      const res = await popupCoService.getDealerByCode(value);\n      if (res.data?.status && res.data?.object) {\n        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, res.data.object.dealerThaiName ?? "");\n      } else {\n        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n      }\n    } catch (err) {\n      errorAlert(err);\n      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n    }\n  }, [searchForm, errorAlert]);\n\n` : '') +
    `  const onClear = () => {\n` +
    `    ${options?.useSearchStore ? 'clearSearchParams();\n' : ''}` +
    `    searchForm.reset(default${pascalName}Values);\n` +
    `${options?.hasDealerSearch ? '    lastDealerCode.current = "";\n' : ''}` +
    `  };\n\n` +
         (watchLines ? watchLines + `\n\n` : '') +
    `  const dynamicForm: DynamicField[] = [\n` +
    `${inputsStr}\n` +
    `  ];\n\n` +
    `  const formButtons: ButtonConfig[] = [\n` +
    `    { labelId: "BUTTON.SEARCH", type: "submit", showButton: true },\n` +
    `    { labelId: "BUTTON.CLEAR", type: "button", showButton: true, onClick: onClear }\n` +
    `  ];\n\n` +
    `  return (\n` +
    `    <div className="bg-muted flex flex-col w-full h-full">\n` +
    `      <div className="flex flex-row w-full p-6 pb-0 md:p-10 md:pb-0">\n` +
    `        <CustomCard header={header} className="w-full h-fit">\n` +
    `          <BoxContainer>\n` +
    `            <DynamicForm\n` +
    `              inputFormControl={searchForm}\n` +
    `              formId="searchForm"\n` +
    `              fields={dynamicForm}\n` +
    `              buttons={formButtons}\n` +
    `              onSubmit={() => {}}\n` +
    `              columnsNo="2"\n` +
    `              buttonColumnsNo="2"\n` +
    `            />\n` +
    `          </BoxContainer>\n` +
    `        </CustomCard>\n` +
    `      </div>\n` +
    `${options?.hasDealerSearch ? `      <CoDealerPopUp popup={dealerPopup} setPopup={setDealerPopup} setReturnData={setDealerData} />\n` : ''}` +
    `    </div>\n` +
    `  );\n` +
    `};\n\n` +
    `export default ${pascalName};\n`;
}

// ============================================================================
// 🔥 4. FRONTEND REPORT VIEW COMPONENT GENERATOR (สถาปัตยกรรมระดับสูงสุดตรงตามต้นฉบับ)
// ============================================================================
export function generateFrontendReportComponent(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  buttons: ButtonsSelection,
  reportFileName: string,
  reportEngine: 'direct' | 'crystal' | 'jasper' = 'direct',
  pageHeader?: string,
  options?: GeneratorOptions
): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();

  // ดึงกลุ่ม .watch ออกมาเตรียมประกาศไว้ด้านบน
  const dateFields = fields.filter(f => f.type === 'LocalDate' || f.frontendType === 'calendar');
  const watchLines = dateFields.map(f => `  const ${f.name} = searchForm.watch(${pascalName}ModelFields.${toSnakeCase(f.name)});`).join('\n');

  // จัดเตรียมฟิลด์อินพุต
  let inputsStr = fields.map(f => getFieldInputTemplate(f, pascalName)).join(',\n');
  if (options?.hasDealerSearch) {
    inputsStr = getDealerFieldsTemplate(pascalName) + (inputsStr ? ",\n" + inputsStr : "");
  }

  const reportDisplayTitle = toPascalCase(reportFileName || (moduleName + 'Report')).replace(/([a-z])([A-Z])/g, '$1 $2');

  // ข้อมูล Zustand Store ที่สอดคล้องตามตัวเลือกจริง
  let storeImport = options?.useSearchStore ? `import { use${pascalName}SearchStore } from "@/_providers/${typeLower}/${camelName}/${camelName}SearchStore.provider";\n` : '';
  let storeHooks = options?.useSearchStore ? 
    `  const searchParams = use${pascalName}SearchStore((s) => s.searchParams);\n` +
    `  const setSearchParams = use${pascalName}SearchStore((s) => s.setSearchParams);\n` +
    `  const clearSearchParams = use${pascalName}SearchStore((s) => s.clearSearchParams);\n\n` : '';
    
// ดึงฟิลด์ที่เป็น LocalDate ทั้งหมดที่มีในหน้าจอมาสร้างบรรทัดแปลง Date object แบบไดนามิก
  const localDateFields = fields.filter(f => f.type === 'LocalDate' || f.frontendType === 'calendar');
  const storeEffectFieldsStr = localDateFields.map(f => {
    const fieldVar = `${pascalName}ModelFields.${toSnakeCase(f.name)}`;
    return `        [${fieldVar}]: searchParams[${fieldVar}] ? new Date(searchParams[${fieldVar}]) : undefined,`;
  }).join('\n');

// 1. สร้างส่วนประกาศตัวแปรก่อนเข้าฟังก์ชัน reset
  const watchFields = fields.filter(f => f.type === 'LocalDate' || f.frontendType === 'calendar');
  const dateConstDeclarations = watchFields.map(f => {
    const fieldVar = `${pascalName}ModelFields.${toSnakeCase(f.name)}`;
    return `      const raw_${f.name} = searchParams[${fieldVar}];`;
  }).join('\n');

  // 2. สร้างบรรทัด map ค่าลงใน reset object
  const dateResetMappings = watchFields.map(f => {
    const fieldVar = `${pascalName}ModelFields.${toSnakeCase(f.name)}`;
    return `        [${fieldVar}]: raw_${f.name} ? new Date(raw_${f.name}) : undefined,`;
  }).join('\n');

  // 3. ประกอบเป็น useEffect เทมเพลต
  let storeEffect = options?.useSearchStore ? 
    `  useEffect(() => {\n` +
    `    if (searchParams) {\n` +
    `${dateConstDeclarations}\n\n` +
    `      searchForm.reset({\n` +
    `        ...searchParams,\n` +
    `${dateResetMappings}\n` +
    `      });\n` +
    `    }\n` +
    `  }, [searchParams]);\n\n` : '';
  let storeSaveAction = options?.useSearchStore ? `    setSearchParams(searchForm.getValues());\n\n` : '';
  let storeClearAction = options?.useSearchStore ? `clearSearchParams();\n` : '';

  return `"use client";\n\n` +
    `// React core\n` +
    `import { useRef, useState, useEffect, useCallback } from "react";\n` +
    `import { useForm } from "react-hook-form";\n\n` +
    `// External libs\n` +
    `import z from "zod";\n` +
    `import { zodResolver } from "@hookform/resolvers/zod";\n\n` +
    `// Layout / UI components\n` +
    `import { CustomCard } from "@/components/layout/Form/Card";\n` +
    `import DynamicForm, { ButtonConfig, DynamicField } from "@/components/layout/Form/dynamic-form-builder";\n` +
    `import BoxContainer from "@/components/ui/box-container";\n\n` +
    `// Shared / feature components\n` +
    `${options?.hasDealerSearch ? `import CoDealerPopUp from "../shared/coDealerPopUp";\n` : ''}` +
    `\n// Services\n` +
    `${options?.hasDealerSearch ? `import { popupCoService } from "@/_service/co/popupCo.service";\n` : ''}` +
    `import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}/${camelName}.service";\n\n` +
    `// Providers / stores\n` +
    `import { useLoading } from "@/_providers/loader-provider";\n` +
    `import { useAlert } from "@/_providers/alert-provider";\n` +
    `${storeImport}\n` +
    `// Helpers / utils\n` +
    `import { FormHelper } from "@/_helpers/form-helper";\n` +
    `import { downloadBlob, resolveReportFileName } from "@/_helpers/crystal-report-helper";\n\n` +
    `// Schemas / models\n` +
    `import { ${pascalName}Schema, default${pascalName}Values } from "./schemas/${camelName}Schema";\n` +
    `import { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}/${camelName}.model";\n` +
    `${options?.hasDealerSearch ? `import { PopupCoDealerModel } from "@/_models/co/popupCo.model";\n` : ''}\n` +
    `const header = "${pageHeader || `รายงานข้อมูล ${pascalName}`}";\n\n` +
    `const ${pascalName} = () => {\n` +
         (options?.hasDealerSearch ? `  const [dealerPopup, setDealerPopup] = useState<boolean>(false);\n  const [dealerData, setDealerData] = useState<PopupCoDealerModel>({});\n\n  const lastDealerCode = useRef<string>("");\n\n` : '') +
    `  const { errorAlert } = useAlert();\n` +
    `  const loading = useLoading((s) => s.loading);\n` +
    `  const setLoading = useLoading((s) => s.setLoading);\n\n` +
         storeHooks +
    `  const searchForm = useForm<z.infer<typeof ${pascalName}Schema>>({\n` +
    `    resolver: zodResolver(${pascalName}Schema),\n` +
    `    defaultValues: ${options?.useSearchStore ? 'searchParams' : `default${pascalName}Values`},\n` +
    `    mode: "onChange",\n` +
    `  });\n\n` +
         storeEffect +
         (options?.hasDealerSearch ? `  useEffect(() => {\n    if (dealerData?.bpCode) {\n      searchForm.setValue(${pascalName}ModelFields.DEALER_CODE, dealerData.bpCode ?? "");\n      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, dealerData.dealerThaiName ?? "");\n      lastDealerCode.current = dealerData.bpCode ?? "";\n    }\n  }, [dealerData]);\n\n  const handleDealerBlur = useCallback(async (value: string) => {\n    if (!value || value.trim() === "") {\n      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n      lastDealerCode.current = "";\n      return;\n    }\n    if (value === lastDealerCode.current) return;\n    lastDealerCode.current = value;\n    try {\n      const res = await popupCoService.getDealerByCode(value);\n      if (res.data?.status && res.data?.object) {\n        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, res.data.object.dealerThaiName ?? "");\n      } else {\n        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n      }\n    } catch (err) {\n      errorAlert(err);\n      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n    }\n  }, [searchForm, errorAlert]);\n\n` : '') +
    `  const onClear = () => {\n` +
    `    ${storeClearAction}` +
    `    searchForm.reset(default${pascalName}Values);\n` +
    `${options?.hasDealerSearch ? '    lastDealerCode.current = "";\n' : ''}` +
    `  };\n\n` +
         (watchLines ? watchLines + `\n\n` : '') +
    `  const dynamicForm: DynamicField[] = [\n` +
    `${inputsStr}\n` +
    `  ];\n\n` +
    `  const formButtons: ButtonConfig[] = [\n` +
    `    { labelId: "BUTTON.PRINT", type: "submit", showButton: true },\n` +
    `    { labelId: "BUTTON.CLEAR", type: "button", showButton: true, onClick: onClear }\n` +
    `  ];\n\n` +
    `  const onExport = async (rawValues: z.infer<typeof ${pascalName}Schema>) => {\n` +
    `    if (loading) {\n` +
    `      return;\n` +
    `    }\n\n` +
         storeSaveAction +
    `    const values = FormHelper.normalizeSearchParams(rawValues) as ${pascalName}Model;\n\n` +
    `    setLoading(true);\n` +
    `    try {\n` +
    `      const res = await ${camelName}Service.export${pascalName}(values);\n\n` +
    `      if (!res.data || res.data.size === 0) {\n` +
    `        errorAlert("ไม่พบข้อมูลที่ค้นหา");\n` +
    `        setLoading(false);\n` +
    `        return;\n` +
    `      }\n\n` +
    `      const fileName = resolveReportFileName('${reportDisplayTitle}', 'xlsx', res.headers?.["content-disposition"]);\n` +
    `      const blob = new Blob([res.data], { type: "application/octet-stream" });\n` +
    `      downloadBlob(blob, fileName);\n` +
    `    } catch (err) {\n` +
    `      errorAlert(err);\n` +
    `    } finally {\n` +
    `      setLoading(false);\n` +
    `    }\n` +
    `  };\n\n` +
    `  return (\n` +
    `    <div className="bg-muted flex flex-col w-full h-full">\n` +
    `      <div className="flex flex-row w-full p-6 pb-0 md:p-10 md:pb-0">\n` +
    `        <CustomCard header={header} className="w-full h-fit">\n` +
    `          <BoxContainer>\n` +
    `            <DynamicForm\n` +
    `              inputFormControl={searchForm}\n` +
    `              formId="searchForm"\n` +
    `              fields={dynamicForm}\n` +
    `              buttons={formButtons}\n` +
    `              onSubmit={onExport}\n` +
    `              columnsNo="2"\n` +
    `              buttonColumnsNo="2"\n` +
    `            />\n` +
    `          </BoxContainer>\n` +
    `        </CustomCard>\n` +
    `      </div>\n` +
    `${options?.hasDealerSearch ? `      <CoDealerPopUp popup={dealerPopup} setPopup={setDealerPopup} setReturnData={setDealerData} />\n` : ''}` +
    `    </div>\n` +
    `  );\n` +
    `};\n\n` +
    `export default ${pascalName};\n`;
}

// ข้อที่ 5: ฟังก์ชันสร้างไฟล์สคริปต์สิทธิ์ Oracle SQL อัตโนมัติ (คงเดิมไว้)
export function generatePermissionSQL(moduleName: string, moduleType: string, options: GeneratorOptions): string {
  const programId = options.programId || 'COPR07';
  const legacyUrl = options.legacyUrl || `/${programId}${toPascalCase(moduleName)}.do`;
  const routingPath = options.routingPath || `/${toCamelCase(moduleName)}`;
  const roleCode = options.roleCode || 'SKL-IT-ASS';
  const pascalName = toPascalCase(moduleName);

  return `-- ============================================================================\n` +
         `-- PERMISSION — ${programId} (${pascalName})\n` +
         `-- ============================================================================\n\n` +
         `-- ── STEP 1 : CT_MENU_PAGE_V1 ─────────────────────────────────────────────────\n` +
         `-- (เช็คก่อน)\n` +
         `SELECT *\nFROM CT_MENU_PAGE_V1\nWHERE MP_CONTROL = '${legacyUrl}';\n\n` +
         `UPDATE CT_MENU_PAGE_V1\nSET MP_PROGRAM_ID   = '${programId}',\n    MP_ROUTING_PATH = '${routingPath}'\n` +
         `WHERE MP_CONTROL    = '${legacyUrl}'\n  AND MP_ACTION     = 'inquiry'\n  AND MP_PROGRAM_ID IS NULL;\nCOMMIT;\n\n\n` +
         `-- ── STEP 1.5 : CT_MENU_FUNC_V1 ───────────────────────────────────────────────\n` +
         `UPDATE CT_MENU_FUNC_V1 mf\nSET mf.MF_PROGRAM_ID = (\n` +
         `    SELECT mp.MP_PROGRAM_ID FROM CT_MENU_PAGE_V1 mp\n` +
         `    WHERE mp.MP_CONTROL = mf.MF_CONTROL AND mp.MP_PROGRAM_ID = '${programId}')\n` +
         `WHERE mf.MF_PROGRAM_ID IS NULL\n` +
         `  AND EXISTS (\n` +
         `    SELECT 1 FROM CT_MENU_PAGE_V1 mp\n` +
         `    WHERE mp.MP_CONTROL = mf.MF_CONTROL AND mp.MP_PROGRAM_ID = '${programId}');\nCOMMIT;\n\n\n` +
         `-- ── STEP 2 : เช็ค role ที่ผูกอยู่ (ไม่ต้องแก้) ──────────────────────────────\n` +
         `SELECT DISTINCT mr.MR_ROLE_CODE\nFROM CT_MENU_ROLE mr\n` +
         `JOIN CT_MENU_FUNC_V1 mf ON mf.MF_FUNC_CODE = mr.MR_FUNC_CODE\n` +
         `JOIN CT_MENU_PAGE_V1 mp ON mp.MP_CONTROL   = mf.MF_CONTROL\n` +
         `WHERE mp.MP_PROGRAM_ID = '${programId}';\n\n\n` +
         `-- ── STEP 3 : CT_PROGRAM_PERMISSION_V1 ────────────────────────────────────────\n` +
         `INSERT INTO CT_PROGRAM_PERMISSION_V1\n` +
         `  (CPP_ROLE_CODE, CPP_PROGRAM_ID, CPP_PROGRAM_NAME,\n` +
         `   CPP_ADD_FLAG, CPP_QUERY_FLAG, CPP_UPDATE_FLAG, CPP_DELETE_FLAG,\n` +
         `   CPP_ACCESS_TYPE, CPP_READ_ONLY, CREATE_BY, CREATE_DT)\n` +
         `SELECT r.role, '${programId}', '${programId}${pascalName}',\n` +
         `       'Y', 'Y', 'Y', 'Y', '', 'N', 'MIGRATE-${programId}', SYSTIMESTAMP\n` +
         `FROM ( SELECT '${roleCode}' role FROM dual ) r\n` +
         `WHERE NOT EXISTS (SELECT 1 FROM CT_PROGRAM_PERMISSION_V1 x\n` +
         `                  WHERE x.CPP_ROLE_CODE = r.role AND x.CPP_PROGRAM_ID = '${programId}');\nCOMMIT;\n\n\n` +
         `-- ── STEP 4 : CT_API_PATH_PROGRAM ─────────────────────────────────────────────\n` +
         `INSERT INTO CT_API_PATH_PROGRAM (APP_API_PATH, APP_PROGRAM_ID, APP_CREATE_BY)\n` +
         `SELECT '/${moduleType.toLowerCase()}${routingPath}', '${programId}', 'MIGRATE-${programId}' FROM dual\n` +
         `WHERE NOT EXISTS (SELECT 1 FROM CT_API_PATH_PROGRAM\n` +
         `                  WHERE APP_API_PATH = '/${moduleType.toLowerCase()}${routingPath}' AND APP_PROGRAM_ID = '${programId}');\nCOMMIT;\n\n\n` +
         `-- ── VERIFY ────────────────────────────────────────────────────────────────────\n` +
         `SELECT (SELECT COUNT(*) FROM CT_API_PATH_PROGRAM\n` +
         `        WHERE APP_PROGRAM_ID = '${programId}')                                        AS path_rows,\n` +
         `       (SELECT COUNT(DISTINCT CPP_ROLE_CODE) FROM CT_PROGRAM_PERMISSION_V1\n` +
         `        WHERE CPP_PROGRAM_ID = '${programId}')                                        AS granted_roles\n` +
         `FROM dual;\n` +
         `-- 👉 เสร็จแล้ว restart permission-service\n`;
}