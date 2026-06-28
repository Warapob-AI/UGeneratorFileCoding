// Utility functions for string casing
export function toPascalCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\s\-_]+/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, '');
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
  if (lower.endsWith('from') || lower.endsWith('ตั้งแต่')) {
    return 'วันที่ ตั้งแต่';
  }
  if (lower.endsWith('to') || lower.endsWith('ถึง')) {
    return 'ถึง';
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
    let getter = f.type === 'Integer' ? 'Int' : f.type === 'Long' ? 'Long' : f.type === 'Double' ? 'Double' : f.type === 'BigDecimal' ? 'BigDecimal' : 'String';
    return f.type === 'LocalDate'
      ? `                        .${f.name}(rs.getDate("${f.columnName || toSnakeCase(f.name)}") != null ? rs.getDate("${f.columnName || toSnakeCase(f.name)}").toLocalDate() : null)`
      : `                        .${f.name}(rs.get${getter}("${f.columnName || toSnakeCase(f.name)}"))`;
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

export function prepareFrontendFields(
  fields: FieldDefinition[],
  frontendMode?: 'search' | 'report',
  options?: GeneratorOptions
): FieldDefinition[] {
  let finalFields = [...fields];

  if (options?.hasDealerSearch) {
    if (!finalFields.some(f => f.name === 'dealerCode')) finalFields.push({ name: 'dealerCode', type: 'String', columnName: 'DEALER_CODE', isKey: false, label: 'รหัสผู้จำหน่าย' });
    if (!finalFields.some(f => f.name === 'dealerName')) finalFields.push({ name: 'dealerName', type: 'String', columnName: 'DEALER_NAME', isKey: false, label: 'ชื่อผู้จำหน่าย' });
  }

  if (frontendMode !== 'report') {
    if (!finalFields.some(f => f.name === 'isEdit')) finalFields.push({ name: 'isEdit', type: 'Boolean', columnName: 'IS_EDIT', isKey: false, label: 'isEdit' });
    if (!finalFields.some(f => f.name === 'isView')) finalFields.push({ name: 'isView', type: 'Boolean', columnName: 'IS_VIEW', isKey: false, label: 'isView' });
  }

  // Reorder finalFields to put dealerCode and dealerName at the top if dealerCode is present
  const dealerCodeIndex = finalFields.findIndex(f => f.name.toLowerCase() === 'dealercode');
  if (dealerCodeIndex !== -1) {
    const dealerCodeField = finalFields[dealerCodeIndex];
    const dealerNameField = finalFields.find(f => f.name.toLowerCase() === 'dealername');
    const remainingFields = finalFields.filter(f => {
      const lower = f.name.toLowerCase();
      return lower !== 'dealercode' && lower !== 'dealername';
    });
    const prepended: FieldDefinition[] = [dealerCodeField];
    if (dealerNameField) {
      prepended.push(dealerNameField);
    }
    finalFields = [...prepended, ...remainingFields];
  }

  return finalFields;
}

export function generateFrontendModel(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  frontendMode?: 'search' | 'report',
  options?: GeneratorOptions
): string {
  if (!fields || fields.length === 0) return '// Add at least one field to generate code.';
  const pascalName = toPascalCase(moduleName);
  const finalFields = prepareFrontendFields(fields, frontendMode, options);

  const modelFieldsStr = finalFields.map(f => `  ${f.name}?: ${mapJavaTypeToTs(f.type)};`).join('\n');
  const fieldsObjectFields = finalFields.map(f => `  ${toSnakeCase(f.name)}: "${f.name}",`).join('\n');

  let code = `export interface ${pascalName}Model {\n${modelFieldsStr}\n}\n\nexport const ${pascalName}ModelFields = {\n${fieldsObjectFields}\n} as const;\n`;
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

  const finalFields = prepareFrontendFields(fields, isReport ? 'report' : 'search', options);
  const mappingParams = finalFields.map(f => f.type === 'LocalDate' ? `      ${f.name}: formatLocalDate(theModel.${f.name}),` : `      ${f.name}: theModel.${f.name},`).join('\n');

  if (isReport) {
    return `import { Constants } from "@/_helpers/constants";\n` +
      `import { formatLocalDate } from "@/_helpers/date-helper";\n` +
      `import axiosBlob from "@/utils/axiosBlob";\n` +
      `import { ${pascalName}Model } from "@/_models/${typeLower}/${camelName}.model";\n\n` +
      `export const ${typeUpper}_${toSnakeCase(moduleName)}_URL = \`\${Constants.URL_${typeUpper}}/${camelName}\`;\n\n` +
      `function export${pascalName}(theModel: ${pascalName}Model) {\n` +
      `  return axiosBlob.get(\`\${${typeUpper}_${toSnakeCase(moduleName)}_URL}/exportExcel\`, {\n` +
      `    params: {\n` +
      `${mappingParams}\n` +
      `    },\n` +
      `  });\n` +
      `}\n\n` +
      `export const ${camelName}Service = {\n` +
      `  export${pascalName},\n` +
      `};\n`;
  }

  return `import { Constants } from "@/_helpers/constants";\n` +
    `import { formatLocalDate } from "@/_helpers/date-helper";\n` +
    `import axios from "@/utils/axiosInstance";\n` +
    `import { Response } from "@/_models/base.model";\n` +
    `import { ${pascalName}Model } from "@/_models/${typeLower}/${camelName}.model";\n\n` +
    `export const ${toSnakeCase(moduleName)}_URL = \`\${Constants.URL_${typeUpper}}/${camelName}\`;\n\n` +
    `function get${pascalName}List(theModel: ${pascalName}Model) {\n` +
    `  return axios.get<Response<${pascalName}Model[]>>(\`\${${toSnakeCase(moduleName)}_URL}/searchList\`, {\n` +
    `    params: {\n` +
    `${mappingParams}\n` +
    `    },\n` +
    `  });\n` +
    `}\n\n` +
    `function save${pascalName}(theModel: ${pascalName}Model) {\n` +
    `  return axios.post<Response<${pascalName}Model>>(\`\${${toSnakeCase(moduleName)}_URL}/save\`, theModel);\n` +
    `}\n\n` +
    `function delete${pascalName}(id: string | number) {\n` +
    `  return axios.delete<Response<void>>(\`\${${toSnakeCase(moduleName)}_URL}/delete/\${id}\`);\n` +
    `}\n\n` +
    `export const ${camelName}Service = {\n` +
    `  get${pascalName}List,\n` +
    `  save${pascalName},\n` +
    `  delete${pascalName},\n` +
    `};\n`;
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

export function generateFrontendSearchSchema(
  moduleName: string,
  fields: FieldDefinition[],
  options?: GeneratorOptions
): string {
  const pascalName = toPascalCase(moduleName);
  const finalFields = prepareFrontendFields(fields, 'search', options);
  const zodFields = finalFields.map(f => `  ${f.name}: ${getZodSchemaField(f)}`).join(',\n');
  const defaults = finalFields.map(f => f.type === 'Boolean' ? `  ${f.name}: "N"` : f.type === 'LocalDate' ? `  ${f.name}: undefined` : `  ${f.name}: ""`).join(',\n');
  return `import { ZodHelper } from "@/_helpers/zod-helper";\n` +
    `import { z } from "zod";\n\n` +
    `export const ${pascalName}SearchSchema = z.object({\n` +
    `${zodFields}\n` +
    `});\n\n` +
    `export const default${pascalName}SearchValues = {\n` +
    `${defaults}\n` +
    `};\n`;
}

export function generateFrontendSearchTable(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  options?: GeneratorOptions
): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const finalFields = prepareFrontendFields(fields, 'search', options);
  const columnsDef = finalFields.map(f => f.type === 'LocalDate' ? `          constructDateColumn({\n            accessorKey: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n            header: "${f.label || getDefaultLabel(f.name)}",\n          })` : `          {\n            accessorKey: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n            header: "${f.label || getDefaultLabel(f.name)}",\n          }`).join(',\n');
  return `"use client";\n\n` +
    `import { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}.model";\n` +
    `import { constructDateColumn } from "@/components/layout/Form";\n` +
    `import { CustomColTool } from "@/components/layout/Table";\n` +
    `import { MRT_ColumnDef } from "material-react-table";\n` +
    `import { useMemo } from "react";\n\n` +
    `export const ${pascalName}TableColumns = {\n` +
    `  GetColumns: (editAction: (data: ${pascalName}Model) => void, viewAction: (data: ${pascalName}Model) => void) => {\n` +
    `    return useMemo<MRT_ColumnDef<${pascalName}Model>[]>(() => [\n` +
    `      {\n` +
    `        accessorKey: "id",\n` +
    `        header: "No.",\n` +
    `        Cell: ({ row }) => <div>{row.index + 1}</div>,\n` +
    `        muiTableBodyCellProps: { align: "center" },\n` +
    `        size: 100\n` +
    `      },\n` +
    `      {\n` +
    `        accessorKey: "tool",\n` +
    `        header: "Action",\n` +
    `        Cell: ({ row }) => (\n` +
    `          <CustomColTool\n` +
    `            goToEditPage={() => editAction(row.original)}\n` +
    `            goToViewPage={() => viewAction(row.original)}\n` +
    `            isEdit={row.original.isEdit}\n` +
    `            isView={row.original.isView}\n` +
    `          />\n` +
    `        ),\n` +
    `        size: 170\n` +
    `      },\n` +
    `${columnsDef}\n` +
    `    ], [editAction, viewAction]);\n` +
    `  }\n` +
    `};\n`;
}

export function generateFrontendReportSchema(
  moduleName: string,
  fields: FieldDefinition[],
  reportFileName: string,
  options?: GeneratorOptions
): string {
  const finalReportName = reportFileName || (toCamelCase(moduleName) + 'Report');
  const pascalReportName = toPascalCase(finalReportName);
  const finalFields = prepareFrontendFields(fields, 'report', options);
  const zodFields = finalFields.map(f => `  ${f.name}: ${getZodSchemaField(f)}`).join(',\n');
  const defaults = finalFields.map(f => f.type === 'Boolean' ? `  ${f.name}: "N"` : f.type === 'LocalDate' ? `  ${f.name}: undefined` : `  ${f.name}: ""`).join(',\n');
  return `import { ZodHelper } from "@/_helpers/zod-helper";\n` +
    `import { z } from "zod";\n\n` +
    `export const ${pascalReportName}Schema = z.object({\n` +
    `${zodFields}\n` +
    `});\n\n` +
    `export const default${pascalReportName}Values = {\n` +
    `${defaults}\n` +
    `};\n`;
}

export function generateFrontendFormSchema(
  moduleName: string,
  fields: FieldDefinition[],
  options?: GeneratorOptions
): string {
  const pascalName = toPascalCase(moduleName);
  const finalFields = prepareFrontendFields(fields, 'search', options);
  const zodFields = finalFields.map(f => `  ${f.name}: ${getZodSchemaField(f)}`).join(',\n');
  const defaults = finalFields.map(f => f.type === 'Boolean' ? `  ${f.name}: "N"` : f.type === 'LocalDate' ? `  ${f.name}: undefined` : `  ${f.name}: ""`).join(',\n');
  return `import { ZodHelper } from "@/_helpers/zod-helper";\n` +
    `import { z } from "zod";\n\n` +
    `export const ${pascalName}FormSchema = z.object({\n` +
    `${zodFields}\n` +
    `});\n\n` +
    `export const default${pascalName}FormValues = {\n` +
    `${defaults}\n` +
    `};\n`;
}

export function generateFrontendSearchStore(moduleName: string, moduleType: string): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  return `"use client";\n\n` +
    `import { create } from "zustand";\n` +
    `import { createJSONStorage, persist } from "zustand/middleware";\n` +
    `import { default${pascalName}SearchValues } from "@/components/hpls/${typeLower}/${camelName}/schemas/${camelName}SearchSchema";\n\n` +
    `export type ${pascalName}SearchState = {\n` +
    `  searchParams: typeof default${pascalName}SearchValues;\n` +
    `  useParamsFlag: boolean;\n` +
    `  setSearchParams: (\n` +
    `    params: Partial<${pascalName}SearchState["searchParams"]>\n` +
    `  ) => void;\n` +
    `  setUseParamsFlag: (useParam: boolean) => void;\n` +
    `};\n\n` +
    `export const use${pascalName}SearchStore = create<${pascalName}SearchState>()(\n` +
    `  persist(\n` +
    `    (set) => ({\n` +
    `      searchParams: default${pascalName}SearchValues,\n` +
    `      useParamsFlag: false,\n` +
    `      setSearchParams: (params) =>\n` +
    `        set((state) => ({\n` +
    `          searchParams: { ...state.searchParams, ...params },\n` +
    `        })),\n` +
    `      setUseParamsFlag: (flag) => set({ useParamsFlag: flag }),\n` +
    `    }),\n` +
    `    {\n` +
    `      name: "${camelName}-search-store",\n` +
    `      storage: createJSONStorage(() => localStorage),\n` +
    `    }\n` +
    `  )\n` +
    `);\n`;
}


function getFieldInputTemplate(f: FieldDefinition, pascalName: string, allFields: FieldDefinition[] = []): string {
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

  // Snippet สำหรับ isRequired
  const reqSnippet = f.isRequired ? `,\n      isRequired: true` : '';

  // 3. พ่นโครงสร้างอ็อบเจกต์ส่งออกตามประเภท UI
  if (uiType === 'checkbox') {
    return `    {\n      type: 'checkbox',\n      fieldName: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n      label: '${label}'${disableSnippet}${reqSnippet}\n    }`;
  } else if (uiType === 'calendar') {
    let rangeProps = '';
    const matchToName = findMatchingToField(f.name, allFields);
    const matchFromName = findMatchingFromField(f.name, allFields);
    if (matchToName) {
      rangeProps = `,\n      maxDate: ${toCamelCase(matchToName)} as Date | undefined`;
    } else if (matchFromName) {
      rangeProps = `,\n      minDate: ${toCamelCase(matchFromName)} as Date | undefined`;
    } else {
      const lowerName = f.name.toLowerCase();
      if (lowerName.includes('from')) {
        const matchTo = f.name.replace(/from/i, 'To');
        rangeProps = `,\n      maxDate: ${toCamelCase(matchTo)} as Date | undefined`;
      } else if (lowerName.includes('to')) {
        const matchFrom = f.name.replace(/to/i, 'From');
        rangeProps = `,\n      minDate: ${toCamelCase(matchFrom)} as Date | undefined`;
      }
    }
    return `    {\n      type: 'calendar',\n      fieldName: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n      label: '${label}',\n      isRequired: ${f.isRequired ? 'true' : 'false'}${rangeProps}${disableSnippet}\n    }`;
  } else {
    let typeAttr = uiType;
    let inputTypeSnippet = '';
    if (uiType === 'number') {
      typeAttr = 'text';
      inputTypeSnippet = `,\n      inputType: 'number'`;
    }

    let maxLenSnippet = '';
    if ((uiType === 'text' || uiType === 'textarea' || uiType === 'number') && f.maxLength !== undefined && f.maxLength > 0) {
      maxLenSnippet = `,\n      maxLength: ${f.maxLength}`;
    }

    // รองรับ text, number, select, radio ได้อย่างถูกต้องแม่นยำตามที่เลือกบน UI
    return `    {\n      type: '${typeAttr}',\n      fieldName: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n      label: '${label}'${optionsSnippet}${disableSnippet}${inputTypeSnippet}${reqSnippet}${maxLenSnippet}\n    }`;
  }
}

function getDealerFieldsTemplate(pascalName: string): string {
  return `    {\n      type: 'text',\n      fieldName: ${pascalName}ModelFields.DEALER_CODE,\n      label: 'รหัส Dealer',\n      maxLength: 20,\n      onBlur: (value: string) => handleDealerBlur(value),\n      button: {\n        labelId: 'BUTTON.SEARCH',\n        type: 'button',\n        text: '',\n        showButton: true,\n        onClick: () => setDealerPopup(true),\n      } as ButtonConfig,\n    },\n` +
    `    {\n      type: 'text',\n      fieldName: ${pascalName}ModelFields.DEALER_NAME,\n      label: ' ',\n      disable: true,\n      maxLength: 200,\n    }`;
}

function buildImports(sections: { category: string; imports: string[] }[]): string {
  return sections
    .map(sec => {
      const activeImports = sec.imports.filter(Boolean);
      if (activeImports.length === 0) return '';
      return `// ${sec.category}\n${activeImports.join('\n')}\n`;
    })
    .filter(Boolean)
    .join('\n');
}

export function generateFrontendDetailComponent(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  buttons: ButtonsSelection,
  options?: GeneratorOptions
): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();

  const finalFields = prepareFrontendFields(fields, 'search', options);
  const inputsStr = finalFields.map(f => getFieldInputTemplate(f, pascalName, finalFields)).join(',\n');

  return `"use client";\n\n` +
    `import { useEffect } from "react";\n` +
    `import { useForm } from "react-hook-form";\n` +
    `import { zodResolver } from "@hookform/resolvers/zod";\n` +
    `import z from "zod";\n` +
    `import { CustomDialog } from "@/components/layout/Form/CustomDialog";\n` +
    `import DynamicForm, { ButtonConfig, DynamicField } from "@/components/layout/Form/dynamic-form-builder";\n` +
    `import BoxContainer from "@/components/ui/box-container";\n` +
    `import { useLoading } from "@/_providers/loader-provider";\n` +
    `import { useAlert } from "@/_providers/alert-provider";\n` +
    `import { ${pascalName}FormSchema } from "../schemas/${camelName}FormSchema";\n` +
    `import { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}.model";\n` +
    `import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}/${camelName}.service";\n\n` +
    `interface ${pascalName}FormModalProps {\n` +
    `  open: boolean;\n` +
    `  setOpen: (open: boolean) => void;\n` +
    `  data?: ${pascalName}Model;\n` +
    `  onSuccess?: () => void;\n` +
    `}\n\n` +
    `const ${pascalName}FormModal = ({ open, setOpen, data, onSuccess }: ${pascalName}FormModalProps) => {\n` +
    `  const { openAlert, errorAlert } = useAlert();\n` +
    `  const setLoading = useLoading((s) => s.setLoading);\n\n` +
    `  const modalForm = useForm<z.infer<typeof ${pascalName}FormSchema>>({\n` +
    `    resolver: zodResolver(${pascalName}FormSchema),\n` +
    `    defaultValues: data || {},\n` +
    `    mode: "onChange",\n` +
    `  });\n\n` +
    `  useEffect(() => {\n` +
    `    if (open) {\n` +
    `      modalForm.reset(data || {});\n` +
    `    }\n` +
    `  }, [open, data, modalForm]);\n\n` +
    `  const onSubmit = async (values: z.infer<typeof ${pascalName}FormSchema>) => {\n` +
    `    setLoading(true);\n` +
    `    try {\n` +
    `      const res = await ${camelName}Service.save${pascalName}(values as ${pascalName}Model);\n` +
    `      if (res.data?.status) {\n` +
    `        openAlert(res.data.messageLocal || "บันทึกข้อมูลสำเร็จ", "success" as any);\n` +
    `        setOpen(false);\n` +
    `        if (onSuccess) onSuccess();\n` +
    `      } else {\n` +
    `        openAlert(res.data.messageLocal || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error" as any);\n` +
    `      }\n` +
    `    } catch (err) {\n` +
    `      errorAlert(err);\n` +
    `    } finally {\n` +
    `      setLoading(false);\n` +
    `    }\n` +
    `  };\n\n` +
    `  const formFields: DynamicField[] = [\n` +
    `${inputsStr}\n` +
    `  ];\n\n` +
    `  const formButtons: ButtonConfig[] = [\n` +
    `    { labelId: "BUTTON.SAVE", type: "submit", showButton: !data?.isView },\n` +
    `    { labelId: "BUTTON.CLOSE", type: "button", showButton: true, onClick: () => setOpen(false) }\n` +
    `  ];\n\n` +
    `  return (\n` +
    `    <CustomDialog\n` +
    `      open={open}\n` +
    `      onOpenChange={setOpen}\n` +
    `      title={data?.isView ? "ดูรายละเอียด" : data?.isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}\n` +
    `      size="lg"\n` +
    `    >\n` +
    `      <BoxContainer variant="compact">\n` +
    `        <DynamicForm\n` +
    `          inputFormControl={modalForm}\n` +
    `          formId="${camelName}FormModal"\n` +
    `          fields={formFields}\n` +
    `          buttons={formButtons}\n` +
    `          onSubmit={onSubmit}\n` +
    `          columnsNo="2"\n` +
    `        />\n` +
    `      </BoxContainer>\n` +
    `    </CustomDialog>\n` +
    `  );\n` +
    `};\n\n` +
    `export default ${pascalName}FormModal;\n`;
}

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

  const hasBranch = fields.some(f => f.name === 'branch');
  const dropdownFields = fields.filter(f => f.frontendType === 'select' || f.frontendType === 'radio');
  const hasDropdowns = dropdownFields.length > 0;
  const hasDealer = !!options?.hasDealerSearch;

  // Build imports
  const reactImports = ['useRef', 'useState', 'useEffect', 'useCallback', 'useMemo'];
  const reactCoreImport = `import { ${reactImports.join(', ')} } from "react";\nimport { useForm } from "react-hook-form";`;

  const externalLibsImport = `import z from "zod";\nimport { zodResolver } from "@hookform/resolvers/zod";\nimport { useRouter } from "next/navigation";`;

  const layoutImports = [
    `import { CustomCard } from "@/components/layout/Form/Card";`,
    `import DynamicForm, { ButtonConfig, DynamicField } from "@/components/layout/Form/dynamic-form-builder";`,
    `import BoxContainer from "@/components/ui/box-container";`,
    `import { AlertType, ColPinTable } from "@/components/layout/Form";`
  ];

  const sharedImports = [];
  if (hasDealer) {
    sharedImports.push(`import CoDealerPopUp from "../shared/coDealerPopUp";`);
  }

  const servicesImports = [];
  if (hasDealer) {
    servicesImports.push(`import { popupCoService } from "@/_service/co/popupCo.service";`);
  }
  if (hasDropdowns) {
    servicesImports.push(`import { dropdownService } from "@/_service/${typeLower}/dropdown.service";`);
  }
  servicesImports.push(`import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}/${camelName}.service";`);

  const providersImports = [
    `import { useLoading } from "@/_providers/loader-provider";`,
    `import { useAlert } from "@/_providers/alert-provider";`
  ];
  if (options?.useSearchStore) {
    providersImports.push(`import { use${pascalName}SearchStore } from "@/_providers/${typeLower}/${camelName}/${camelName}SearchStore.provider";`);
  }

  const helpersImports = [];
  if (hasBranch) {
    helpersImports.push(`import { getUser } from "@/_helpers/cookieStore";`);
  }
  helpersImports.push(`import { FormHelper } from "@/_helpers/form-helper";`);

  const schemasImports = [
    `import { ${pascalName}SearchSchema, default${pascalName}SearchValues } from "./schemas/${camelName}SearchSchema";`,
    `import { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}.model";`,
    `import { ${pascalName}TableColumns } from "./tables/${camelName}Table";`
  ];
  if (hasDealer) {
    schemasImports.push(`import { PopupCoDealerModel } from "@/_models/co/popupCo.model";`);
  }
  if (hasDropdowns) {
    schemasImports.push(`import { DropdownModel } from "@/_models/form.model";`);
  }

  const importsSection = buildImports([
    { category: 'React core', imports: [reactCoreImport] },
    { category: 'External libs', imports: [externalLibsImport] },
    { category: 'Layout / UI components', imports: layoutImports },
    { category: 'Shared / feature components', imports: sharedImports },
    { category: 'Providers / stores', imports: providersImports },
    { category: 'Services', imports: servicesImports },
    { category: 'Helpers / utils', imports: helpersImports },
    { category: 'Schemas / models', imports: schemasImports }
  ]);

  // Dynamic Form Fields & Watch lines
  const dateFields = fields.filter(f => f.type === 'LocalDate' || f.frontendType === 'calendar');
  const watchLines = dateFields.map(f => `  const ${f.name} = searchForm.watch(${pascalName}ModelFields.${toSnakeCase(f.name)});`).join('\n');

  let inputsStr = fields.map(f => getFieldInputTemplate(f, pascalName, fields)).join(',\n');
  if (hasDealer) {
    inputsStr = getDealerFieldsTemplate(pascalName) + (inputsStr ? ",\n" + inputsStr : "");
  }

  let sectionIndex = 1;

  // Section 1: State & refs
  const stateLines = [];
  stateLines.push(`  const [showResult, setShowResult] = useState<boolean>(false);`);
  if (hasDealer) {
    stateLines.push(`  const [dealerPopup, setDealerPopup] = useState<boolean>(false);`);
  }
  if (hasBranch) {
    stateLines.push(`  const [userBranch, setUserBranch] = useState<string>();`);
  }
  stateLines.push(`  const [dataTable, setDataTable] = useState<${pascalName}Model[]>([]);`);
  if (hasDealer) {
    stateLines.push(`  const lastDealerCode = useRef<string>("");`);
  }
  const section1 = `  // === ${sectionIndex++}. State & refs ===\n${stateLines.join('\n')}\n\n`;

  // Section 2: Providers / stores
  const providerLines = [];
  providerLines.push(`  const { openAlert, errorAlert } = useAlert();`);
  providerLines.push(`  const loading = useLoading((s) => s.loading);`);
  providerLines.push(`  const setLoading = useLoading((s) => s.setLoading);`);
  providerLines.push(`  const router = useRouter();`);
  if (options?.useSearchStore) {
    providerLines.push(`  const searchParams = use${pascalName}SearchStore((s) => s.searchParams);`);
    providerLines.push(`  const setSearchParams = use${pascalName}SearchStore((s) => s.setSearchParams);`);
    providerLines.push(`  const useParamsFlag = use${pascalName}SearchStore((s) => s.useParamsFlag);`);
    providerLines.push(`  const setUseParamsFlag = use${pascalName}SearchStore((s) => s.setUseParamsFlag);`);
  }
  const section2 = `  // === ${sectionIndex++}. Providers/stores ===\n${providerLines.join('\n')}\n\n`;

  // Section 3: Form setup
  const section3 = `  // === ${sectionIndex++}. Form setup ===\n` +
    `  const searchForm = useForm<z.infer<typeof ${pascalName}SearchSchema>>({\n` +
    `    resolver: zodResolver(${pascalName}SearchSchema),\n` +
    `    defaultValues: ${options?.useSearchStore ? 'searchParams' : `default${pascalName}SearchValues`},\n` +
    `    mode: "onChange",\n` +
    `  });\n` +
    (watchLines ? `\n` + watchLines + `\n\n` : `\n`);

  // Section 4: Dropdown state
  let section4 = '';
  if (hasDropdowns) {
    const dropdownStateFields = dropdownFields.map(f => `    ${toCamelCase(f.name)}Options: [] as DropdownModel[],`).join('\n');
    section4 = `  // === ${sectionIndex++}. Dropdown state ===\n` +
      `  const [dropdowns, setDropdowns] = useState({\n` +
      `${dropdownStateFields}\n` +
      `  });\n\n` +
      `  const memoizedDropdown = useMemo(() => dropdowns, [dropdowns]);\n\n`;
  }

  // Section 5: User default branch
  let section5 = '';
  if (hasBranch) {
    section5 = `  // === ${sectionIndex++}. User default branch ===\n` +
      `  const setDefaultBranch = async () => {\n` +
      `    const userProps = await getUser();\n` +
      `    const branchCode = userProps?.branchCode;\n` +
      `    setUserBranch(branchCode);\n` +
      `    if (branchCode) {\n` +
      `      searchForm.setValue(${pascalName}ModelFields.BRANCH, branchCode);\n` +
      `    }\n` +
      `  };\n\n`;
  }

  // Section 6: Effects
  let effectBody = '';
  if (hasBranch) {
    effectBody += `    setDefaultBranch();\n`;
  }
  if (hasDropdowns) {
    effectBody += `    fetchDropdowns();\n`;
  }
  if (options?.useSearchStore) {
    const dateRestores = dateFields.map(f => `        ${f.name}: searchParams.${f.name} ? new Date(searchParams.${f.name} as unknown as string) : undefined,`).join('\n');
    effectBody += `\n    if (useParamsFlag) {\n` +
      `      searchForm.reset({\n` +
      `        ...searchParams,\n` +
      `${dateRestores}\n` +
      `      });\n` +
      `      setTimeout(() => onSearch(), 0);\n` +
      `    }\n`;
  }
  const section6 = `  // === ${sectionIndex++}. Effects ===\n` +
    `  useEffect(() => {\n` +
    `${effectBody}` +
    `  }, []);\n\n`;

  // Section 7: Dropdown fetching
  let section7 = '';
  if (hasDropdowns) {
    const fetchPromises = dropdownFields.map(f => {
      if (f.name === 'branch') {
        const getBranchMethod = `get${moduleType.toUpperCase()}BranchListByUser`;
        return `        dropdownService.${getBranchMethod}({\n          showCode: true,\n          required: false,\n        })`;
      } else if (f.name === 'status') {
        return `        dropdownService.get${toPascalCase(moduleName)}StatusDropdown({\n          showCode: true,\n          required: false,\n        })`;
      } else {
        return `        dropdownService.get${toPascalCase(f.name)}Dropdown({\n          showCode: true,\n          required: false,\n        })`;
      }
    }).join(',\n');

    const destructuring = dropdownFields.map(f => `${toCamelCase(f.name)}List`).join(', ');
    const setFieldsStr = dropdownFields.map(f => `        ${toCamelCase(f.name)}Options: ${toCamelCase(f.name)}List.data,`).join('\n');

    section7 = `  // === ${sectionIndex++}. Dropdown fetching ===\n` +
      `  const fetchDropdowns = async () => {\n` +
      `    setLoading(true);\n` +
      `    try {\n` +
      `      const [${destructuring}] = await Promise.all([\n` +
      `${fetchPromises}\n` +
      `      ]);\n` +
      `      setDropdowns({\n` +
      `${setFieldsStr}\n` +
      `      });\n` +
      `    } catch (error) {\n` +
      `      console.error("Error fetching dropdown data:", error);\n` +
      `    } finally {\n` +
      `      setLoading(false);\n` +
      `    }\n` +
      `  };\n\n`;
  }

  // Section 8: Dealer popup callback
  let section8 = '';
  if (hasDealer) {
    section8 = `  // === ${sectionIndex++}. Dealer popup callback ===\n` +
      `  const handleDealerPopupReturn = (data: PopupCoDealerModel) => {\n` +
      `    searchForm.setValue(${pascalName}ModelFields.DEALER_CODE, data.bpCode ?? "");\n` +
      `    searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, data.dealerThaiName ?? "");\n` +
      `    lastDealerCode.current = data.bpCode ?? "";\n` +
      `  };\n\n`;
  }

  // Section 9: OnBlur handler
  let section9 = '';
  if (hasDealer) {
    section9 = `  // === ${sectionIndex++}. OnBlur handler ===\n` +
      `  const handleDealerBlur = useCallback(async (value: string) => {\n` +
      `    if (!value || value.trim() === "") {\n` +
      `      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n` +
      `      lastDealerCode.current = "";\n` +
      `      return;\n` +
      `    }\n` +
      `    if (value === lastDealerCode.current) return;\n` +
      `    lastDealerCode.current = value;\n` +
      `    try {\n` +
      `      const res = await popupCoService.getDealerByCode(value);\n` +
      `      if (res.data?.status && res.data?.object) {\n` +
      `        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, res.data.object.dealerThaiName ?? "");\n` +
      `      } else {\n` +
      `        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n` +
      `      }\n` +
      `    } catch (err) {\n` +
      `      errorAlert(err);\n` +
      `      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n` +
      `    }\n` +
      `  }, [searchForm, errorAlert]);\n\n`;
  }

  // Section 10: Search handler & Navigation handlers
  let storeSaveAction = options?.useSearchStore ? `    setSearchParams(searchValues);\n` : '';
  const section10 = `  // === ${sectionIndex++}. Navigation ===\n` +
    `  const handleEditAction = (data: ${pascalName}Model) => {\n` +
    `${options?.useSearchStore ? `    setSearchParams(searchForm.getValues());\n    setUseParamsFlag(true);\n` : ''}` +
    `    console.log("Edit Action", data);\n` +
    `  };\n\n` +
    `  const handleViewAction = (data: ${pascalName}Model) => {\n` +
    `    console.log("View Action", data);\n` +
    `  };\n\n` +
    `  // === ${sectionIndex++}. Search handler ===\n` +
    `  const onSearch = (): void => {\n` +
    `    if (loading) return;\n` +
    `    setLoading(true);\n` +
    `    fetchDataTable();\n` +
    `  };\n\n` +
    `  const fetchDataTable = async () => {\n` +
    `    const searchValues = searchForm.getValues();\n` +
    `    ${storeSaveAction}` +
    `    try {\n` +
    `      const res = await ${camelName}Service.get${pascalName}List(FormHelper.normalizeSearchParams(searchValues) as ${pascalName}Model);\n` +
    `      if (res.data?.status && res.data?.object) {\n` +
    `        setDataTable(res.data.object);\n` +
    `        setShowResult(true);\n` +
    `      } else {\n` +
    `        openAlert(res.data.messageLocal || "ไม่พบข้อมูลที่ค้นหา", AlertType.WARNING);\n` +
    `        setDataTable([]);\n` +
    `      }\n` +
    `    } catch (err) {\n` +
    `      errorAlert(err);\n` +
    `    } finally {\n` +
    `      setLoading(false);\n` +
    `${options?.useSearchStore ? `      setUseParamsFlag(false);\n` : ''}` +
    `    }\n` +
    `  };\n\n`;

  // Section 11: Clear handler
  const branchResetInsideClear = hasBranch
    ? `    if (userBranch) {\n      searchForm.setValue(${pascalName}ModelFields.BRANCH, userBranch);\n    }\n`
    : '';
  const section11 = `  // === ${sectionIndex++}. Clear handler ===\n` +
    `  const onClear = () => {\n` +
    `    ${options?.useSearchStore ? `setSearchParams(default${pascalName}SearchValues);\n` : ''}` +
    `    searchForm.reset(default${pascalName}SearchValues);\n` +
    `${branchResetInsideClear}` +
    `${hasDealer ? '    lastDealerCode.current = "";\n' : ''}` +
    `    setShowResult(false);\n` +
    `    setDataTable([]);\n` +
    `  };\n\n`;

  // Section 12: Form fields
  const section12 = `  // === ${sectionIndex++}. Form fields ===\n` +
    `  const tableColumns = ${pascalName}TableColumns.GetColumns(handleEditAction, handleViewAction);\n\n` +
    `  const dynamicForm: DynamicField[] = [\n` +
    `${inputsStr}\n` +
    `  ];\n\n` +
    `  const formButtons: ButtonConfig[] = [\n` +
    `    { labelId: "BUTTON.SEARCH", type: "submit", showButton: true },\n` +
    `    { labelId: "BUTTON.CLEAR", type: "button", showButton: true, onClick: onClear }\n` +
    `  ];\n\n`;

  // Section 13: Render
  const section13 = `  // === ${sectionIndex++}. Render ===\n` +
    `  return (\n` +
    `    <div className="bg-muted flex flex-col w-full h-full">\n` +
    `      <div className="flex flex-row w-full p-6 pb-0 md:p-10 md:pb-0">\n` +
    `        <CustomCard header={HEADER} className="w-full h-fit">\n` +
    `          <BoxContainer>\n` +
    `            <DynamicForm\n` +
    `              inputFormControl={searchForm}\n` +
    `              formId="searchForm"\n` +
    `              fields={dynamicForm}\n` +
    `              buttons={formButtons}\n` +
    `              onSubmit={onSearch}\n` +
    `              columnsNo="2"\n` +
    `              buttonColumnsNo="2"\n` +
    `            />\n` +
    `          </BoxContainer>\n` +
    `          {showResult && (\n` +
    `            <div className="grid auto-rows-min gap-4 mt-6">\n` +
    `              <ColPinTable title="รายการข้อมูล" data={dataTable} columns={tableColumns} />\n` +
    `            </div>\n` +
    `          )}\n` +
    `        </CustomCard>\n` +
    `      </div>\n` +
    `${hasDealer ? `      <CoDealerPopUp\n        popup={dealerPopup}\n        setPopup={setDealerPopup}\n        setReturnData={handleDealerPopupReturn}\n      />\n` : ''}` +
    `    </div>\n` +
    `  );\n`;

  return `"use client";\n\n` +
    `${importsSection}\n` +
    `const HEADER = "${pageHeader || `ค้นหาข้อมูล ${pascalName}`}";\n\n` +
    `const ${pascalName} = () => {\n` +
    section1 +
    section2 +
    section3 +
    section4 +
    section5 +
    section6 +
    section7 +
    section8 +
    section9 +
    section10 +
    section11 +
    section12 +
    section13 +
    `};\n\n` +
    `export default ${pascalName};\n`;
}

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
  const typeUpper = moduleType.toUpperCase();

  const finalReportName = reportFileName || (toCamelCase(moduleName) + 'Report');
  const pascalReportName = toPascalCase(finalReportName);
  const camelReportName = toCamelCase(finalReportName);

  const hasBranch = fields.some(f => f.name === 'branch');
  const dropdownFields = fields.filter(f => f.frontendType === 'select' || f.frontendType === 'radio');
  const hasDropdowns = dropdownFields.length > 0;
  const hasDealer = !!options?.hasDealerSearch;
  const isCrystal = reportEngine === 'crystal';
  const isJasper = reportEngine === 'jasper';

  // Build imports
  const reactImports = ['useRef', 'useState', 'useEffect', 'useCallback', 'useMemo'];
  const reactCoreImport = `import { ${reactImports.join(', ')} } from "react";\nimport { useForm } from "react-hook-form";`;

  const externalLibsImport = [
    `import z from "zod";`,
    `import { zodResolver } from "@hookform/resolvers/zod";`
  ];
  if (isCrystal || isJasper) {
    externalLibsImport.push(`import dayjs from "dayjs";`);
  }
  const externalLibsImportStr = externalLibsImport.join('\n');

  const layoutImports = [
    `import { CustomCard } from "@/components/layout/Form/Card";`,
    `import DynamicForm, { ButtonConfig, DynamicField } from "@/components/layout/Form/dynamic-form-builder";`,
    `import BoxContainer from "@/components/ui/box-container";`
  ];
  if (isCrystal) {
    layoutImports.push(`import CrystalReportModal from "@/components/hpls/report/shared/crystalReportModal";`);
  } else if (isJasper) {
    layoutImports.push(`import JasperReportModal from "@/components/hpls/report/shared/jasperReportModal";`);
  }

  const sharedImports = [];
  if (hasDealer) {
    sharedImports.push(`import CoDealerPopUp from "../shared/coDealerPopUp";`);
  }

  const servicesImports = [];
  if (hasDealer) {
    servicesImports.push(`import { popupCoService } from "@/_service/co/popupCo.service";`);
  }
  if (hasDropdowns) {
    servicesImports.push(`import { dropdownService } from "@/_service/${typeLower}/dropdown.service";`);
  }
  if (reportEngine === 'direct') {
    servicesImports.push(`import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}/${camelName}.service";`);
  }

  const providersImports = [];
  if (reportEngine === 'direct' || hasDropdowns) {
    providersImports.push(`import { useLoading } from "@/_providers/loader-provider";`);
  }
  providersImports.push(`import { useAlert } from "@/_providers/alert-provider";`);
  if (options?.useSearchStore) {
    providersImports.push(`import { use${pascalName}SearchStore } from "@/_providers/${typeLower}/${camelName}/${camelName}SearchStore.provider";`);
  }

  const helpersImports = [];
  if (hasBranch) {
    helpersImports.push(`import { getUser } from "@/_helpers/cookieStore";`);
  }
  if (reportEngine === 'direct') {
    helpersImports.push(`import { FormHelper } from "@/_helpers/form-helper";`);
    helpersImports.push(`import { downloadBlob, resolveReportFileName } from "@/_helpers/crystal-report-helper";`);
  }

  const schemasImports = [
    `import { ${pascalReportName}Schema, default${pascalReportName}Values } from "./schemas/${reportFileName}Schema";`,
    `import { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}.model";`
  ];
  if (hasDealer) {
    schemasImports.push(`import { PopupCoDealerModel } from "@/_models/co/popupCo.model";`);
  }
  if (hasDropdowns) {
    schemasImports.push(`import { DropdownModel } from "@/_models/form.model";`);
  }

  const importsSection = buildImports([
    { category: 'React core', imports: [reactCoreImport] },
    { category: 'External libs', imports: [externalLibsImportStr] },
    { category: 'Layout / UI components', imports: layoutImports },
    { category: 'Shared / feature components', imports: sharedImports },
    { category: 'Providers / stores', imports: providersImports },
    { category: 'Services', imports: servicesImports },
    { category: 'Helpers / utils', imports: helpersImports },
    { category: 'Schemas / models', imports: schemasImports }
  ]);

  // Dynamic Form Fields & Watch lines
  const dateFields = fields.filter(f => f.type === 'LocalDate' || f.frontendType === 'calendar');
  const watchLines = dateFields.map(f => `  const ${f.name} = searchForm.watch(${pascalName}ModelFields.${toSnakeCase(f.name)});`).join('\n');

  let inputsStr = fields.map(f => getFieldInputTemplate(f, pascalName, fields)).join(',\n');
  if (hasDealer) {
    inputsStr = getDealerFieldsTemplate(pascalName) + (inputsStr ? ",\n" + inputsStr : "");
  }

  let sectionIndex = 1;

  // Component Sections
  // Section 1: State & refs
  const stateLines = [];
  if (hasDealer) {
    stateLines.push(`  const [dealerPopup, setDealerPopup] = useState<boolean>(false);`);
  }
  if (isCrystal || isJasper) {
    stateLines.push(`  const [reportOpen, setReportOpen] = useState<boolean>(false);`);
  }
  if (hasBranch) {
    stateLines.push(`  const [userBranch, setUserBranch] = useState<string>();`);
  }
  if (isCrystal || isJasper) {
    stateLines.push(`  const [reportBaseParams, setReportBaseParams] = useState<unknown[]>([]);`);
  }
  if (hasDealer) {
    stateLines.push(`  const lastDealerCode = useRef<string>("");`);
  }
  const section1 = stateLines.length > 0
    ? `  // === ${sectionIndex++}. State & refs ===\n${stateLines.join('\n')}\n\n`
    : '';

  // Section 2: Providers / stores
  const providerLines = [];
  providerLines.push(`  const { errorAlert } = useAlert();`);
  if (reportEngine === 'direct' || hasDropdowns) {
    providerLines.push(`  const loading = useLoading((s) => s.loading);`);
    providerLines.push(`  const setLoading = useLoading((s) => s.setLoading);`);
  }
  if (options?.useSearchStore) {
    providerLines.push(`  const searchParams = use${pascalName}SearchStore((s) => s.searchParams);`);
    providerLines.push(`  const setSearchParams = use${pascalName}SearchStore((s) => s.setSearchParams);`);
    providerLines.push(`  const useParamsFlag = use${pascalName}SearchStore((s) => s.useParamsFlag);`);
    providerLines.push(`  const setUseParamsFlag = use${pascalName}SearchStore((s) => s.setUseParamsFlag);`);
  }
  const section2 = providerLines.length > 0
    ? `  // === ${sectionIndex++}. Providers/stores ===\n${providerLines.join('\n')}\n\n`
    : '';

  // Section 3: Form setup
  const section3 = `  // === ${sectionIndex++}. Form setup ===\n` +
    `  const searchForm = useForm<z.infer<typeof ${pascalReportName}Schema>>({\n` +
    `    resolver: zodResolver(${pascalReportName}Schema),\n` +
    `    defaultValues: ${options?.useSearchStore ? 'searchParams' : `default${pascalReportName}Values`},\n` +
    `    mode: "onChange",\n` +
    `  });\n` +
    (watchLines ? `\n` + watchLines + `\n\n` : `\n`);

  // Section 4: Dropdown state
  let section4 = '';
  if (hasDropdowns) {
    const dropdownStateFields = dropdownFields.map(f => `    ${toCamelCase(f.name)}Options: [] as DropdownModel[],`).join('\n');
    section4 = `  // === ${sectionIndex++}. Dropdown state ===\n` +
      `  const [dropdowns, setDropdowns] = useState({\n` +
      `${dropdownStateFields}\n` +
      `  });\n\n` +
      `  const memoizedDropdown = useMemo(() => dropdowns, [dropdowns]);\n\n`;
  }

  // Section 5: User default branch
  let section5 = '';
  if (hasBranch) {
    section5 = `  // === ${sectionIndex++}. User default branch ===\n` +
      `  const setDefaultBranch = async () => {\n` +
      `    const userProps = await getUser();\n` +
      `    const branchCode = userProps?.branchCode;\n` +
      `    setUserBranch(branchCode);\n` +
      `    if (branchCode) {\n` +
      `      searchForm.setValue(${pascalName}ModelFields.BRANCH, branchCode);\n` +
      `    }\n` +
      `  };\n\n`;
  }

  // Section 6: Effects
  let effectBody = '';
  if (hasBranch) {
    effectBody += `    setDefaultBranch();\n`;
  }
  if (hasDropdowns) {
    effectBody += `    fetchDropdowns();\n`;
  }
  if (options?.useSearchStore) {
    const dateRestores = dateFields.map(f => `        ${f.name}: searchParams.${f.name} ? new Date(searchParams.${f.name} as unknown as string) : undefined,`).join('\n');
    effectBody += `\n    if (useParamsFlag) {\n` +
      `      searchForm.reset({\n` +
      `        ...searchParams,\n` +
      `${dateRestores}\n` +
      `      });\n` +
      `    }\n`;
  }
  const section6 = `  // === ${sectionIndex++}. Effects ===\n` +
    `  useEffect(() => {\n` +
    `${effectBody}` +
    `  }, []);\n\n`;

  // Section 7: Dropdown fetching
  let section7 = '';
  if (hasDropdowns) {
    const fetchPromises = dropdownFields.map(f => {
      if (f.name === 'branch') {
        const getBranchMethod = `get${moduleType.toUpperCase()}BranchListByUser`;
        return `        dropdownService.${getBranchMethod}({\n          showCode: true,\n          required: false,\n        })`;
      } else if (f.name === 'status') {
        return `        dropdownService.get${toPascalCase(moduleName)}StatusDropdown({\n          showCode: true,\n          required: false,\n        })`;
      } else {
        return `        dropdownService.get${toPascalCase(f.name)}Dropdown({\n          showCode: true,\n          required: false,\n        })`;
      }
    }).join(',\n');

    const destructuring = dropdownFields.map(f => `${toCamelCase(f.name)}List`).join(', ');
    const setFieldsStr = dropdownFields.map(f => `        ${toCamelCase(f.name)}Options: ${toCamelCase(f.name)}List.data,`).join('\n');

    section7 = `  // === ${sectionIndex++}. Dropdown fetching ===\n` +
      `  const fetchDropdowns = async () => {\n` +
      `    setLoading(true);\n` +
      `    try {\n` +
      `      const [${destructuring}] = await Promise.all([\n` +
      `${fetchPromises}\n` +
      `      ]);\n` +
      `      setDropdowns({\n` +
      `${setFieldsStr}\n` +
      `      });\n` +
      `    } catch (error) {\n` +
      `      console.error("Error fetching dropdown data:", error);\n` +
      `    } finally {\n` +
      `      setLoading(false);\n` +
      `    }\n` +
      `  };\n\n`;
  }

  // Section 8: Dealer popup callback
  let section8 = '';
  if (hasDealer) {
    section8 = `  // === ${sectionIndex++}. Dealer popup callback ===\n` +
      `  const handleDealerPopupReturn = (data: PopupCoDealerModel) => {\n` +
      `    searchForm.setValue(${pascalName}ModelFields.DEALER_CODE, data.bpCode ?? "");\n` +
      `    searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, data.dealerThaiName ?? "");\n` +
      `    lastDealerCode.current = data.bpCode ?? "";\n` +
      `  };\n\n`;
  }

  // Section 9: OnBlur handler
  let section9 = '';
  if (hasDealer) {
    section9 = `  // === ${sectionIndex++}. OnBlur handler ===\n` +
      `  const handleDealerBlur = useCallback(async (value: string) => {\n` +
      `    if (!value || value.trim() === "") {\n` +
      `      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n` +
      `      lastDealerCode.current = "";\n` +
      `      return;\n` +
      `    }\n` +
      `    if (value === lastDealerCode.current) return;\n` +
      `    lastDealerCode.current = value;\n` +
      `    try {\n` +
      `      const res = await popupCoService.getDealerByCode(value);\n` +
      `      if (res.data?.status && res.data?.object) {\n` +
      `        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, res.data.object.dealerThaiName ?? "");\n` +
      `      } else {\n` +
      `        searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n` +
      `      }\n` +
      `    } catch (err) {\n` +
      `      errorAlert(err);\n` +
      `      searchForm.setValue(${pascalName}ModelFields.DEALER_NAME, "");\n` +
      `    }\n` +
      `  }, [searchForm, errorAlert]);\n\n`;
  }

  // Section 10: Print/Export handler
  let section10 = '';
  if (isCrystal || isJasper) {
    const paramMappings = fields.map(f => {
      if (f.type === 'LocalDate' || f.frontendType === 'calendar') {
        return `      v.${f.name} ? dayjs(v.${f.name}).format("DD/MM/YYYY") : ""`;
      } else {
        return `      v.${f.name} || "default"`;
      }
    }).join(',\n');

    section10 = `  // === ${sectionIndex++}. Print handler ===\n` +
      `  const onPrint = () => {\n` +
      `    const v = searchForm.getValues();\n` +
      `    setReportBaseParams([\n` +
      `${paramMappings}\n` +
      `    ]);\n` +
      `    setReportOpen(true);\n` +
      `  };\n\n`;
  } else {
    let storeSaveAction = options?.useSearchStore ? `    setSearchParams(searchForm.getValues());\n\n` : '';
    const reportDisplayTitle = toPascalCase(reportFileName || (moduleName + 'Report')).replace(/([a-z])([A-Z])/g, '$1 $2');
    section10 = `  // === ${sectionIndex++}. Export handler ===\n` +
      `  const onExport = async (rawValues: z.infer<typeof ${pascalReportName}Schema>) => {\n` +
      `    if (loading) {\n` +
      `      return;\n` +
      `    }\n\n` +
      `${storeSaveAction}` +
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
      `  };\n\n`;
  }

  // Section 11: Clear handler
  const branchResetInsideClear = hasBranch
    ? `    if (userBranch) {\n      searchForm.setValue(${pascalName}ModelFields.BRANCH, userBranch);\n    }\n`
    : '';
  const section11 = `  // === ${sectionIndex++}. Clear handler ===\n` +
    `  const onClear = () => {\n` +
    `    ${options?.useSearchStore ? `setSearchParams(default${pascalReportName}Values);\n` : ''}` +
    `    searchForm.reset(default${pascalReportName}Values);\n` +
    `${branchResetInsideClear}` +
    `${hasDealer ? '    lastDealerCode.current = "";\n' : ''}` +
    `  };\n\n`;

  // Section 12: Form fields
  const submitHandlerName = (isCrystal || isJasper) ? 'onPrint' : 'onExport';
  const section12 = `  // === ${sectionIndex++}. Form fields ===\n` +
    `  const dynamicForm: DynamicField[] = [\n` +
    `${inputsStr}\n` +
    `  ];\n\n` +
    `  const formButtons: ButtonConfig[] = [\n` +
    `    { labelId: "BUTTON.PRINT", type: "submit", showButton: true },\n` +
    `    { labelId: "BUTTON.CLEAR", type: "button", showButton: true, onClick: onClear }\n` +
    `  ];\n\n`;

  // Section 13: Render
  let modalRenderStr = '';
  if (isCrystal) {
    modalRenderStr = `      <CrystalReportModal\n` +
      `        open={reportOpen}\n` +
      `        onOpenChange={setReportOpen}\n` +
      `        reportName="${reportFileName || '08CO-RU01'}"\n` +
      `        baseParams={reportBaseParams}\n` +
      `        title="${pageHeader || `รายงานข้อมูล ${pascalName}`}"\n` +
      `      />\n`;
  } else if (isJasper) {
    modalRenderStr = `      <JasperReportModal\n` +
      `        open={reportOpen}\n` +
      `        onOpenChange={setReportOpen}\n` +
      `        reportName="${reportFileName || '08CO-RU01'}"\n` +
      `        baseParams={reportBaseParams}\n` +
      `        title="${pageHeader || `รายงานข้อมูล ${pascalName}`}"\n` +
      `      />\n`;
  }

  const section13 = `  // === ${sectionIndex++}. Render ===\n` +
    `  return (\n` +
    `    <div className="bg-muted flex flex-col w-full h-full">\n` +
    `      <div className="flex flex-row w-full p-6 pb-0 md:p-10 md:pb-0">\n` +
    `        <CustomCard header={HEADER} className="w-full h-fit">\n` +
    `          <BoxContainer>\n` +
    `            <DynamicForm\n` +
    `              inputFormControl={searchForm}\n` +
    `              formId="searchForm"\n` +
    `              fields={dynamicForm}\n` +
    `              buttons={formButtons}\n` +
    `              onSubmit={${submitHandlerName}}\n` +
    `              columnsNo="2"\n` +
    `              buttonColumnsNo="2"\n` +
    `            />\n` +
    `          </BoxContainer>\n` +
    `        </CustomCard>\n` +
    `      </div>\n` +
    `${hasDealer ? `      <CoDealerPopUp\n        popup={dealerPopup}\n        setPopup={setDealerPopup}\n        setReturnData={handleDealerPopupReturn}\n      />\n` : ''}` +
    `${modalRenderStr}` +
    `    </div>\n` +
    `  );\n`;

  return `"use client";\n\n` +
    `${importsSection}\n` +
    `const HEADER = "${pageHeader || `รายงานข้อมูล ${pascalName}`}";\n\n` +
    `const ${pascalName} = () => {\n` +
    section1 +
    section2 +
    section3 +
    section4 +
    section5 +
    section6 +
    section7 +
    section8 +
    section9 +
    (watchLines ? watchLines + `\n\n` : '') +
    section10 +
    section11 +
    section12 +
    section13 +
    `};\n\n` +
    `export default ${pascalName};\n`;
}

export function generateFrontendPage(
  moduleName: string,
  moduleType: string,
  frontendMode: 'search' | 'report',
  reportFileName: string
): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const reportNameCamel = toCamelCase(reportFileName || moduleName);
  const componentFileName = frontendMode === 'report' ? reportNameCamel : camelName;
  const typeLower = moduleType.toLowerCase();

  return `"use client";\n\n` +
    `import ${pascalName} from '@/components/hpls/${typeLower}/${camelName}/${componentFileName}';\n\n` +
    `export default function Page() {\n` +
    `  return <${pascalName} />;\n` +
    `}\n`;
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