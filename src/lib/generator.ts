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
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

export function toKebabCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export interface FieldDefinition {
  name: string;
  type: string; // 'String' | 'Integer' | 'Long' | 'Double' | 'BigDecimal' | 'LocalDate' | 'Boolean'
  columnName: string;
  isKey: boolean;
  label?: string;
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

// Maps Java types to TypeScript types
export function mapJavaTypeToTs(javaType: string): string {
  switch (javaType) {
    case 'String': return 'string';
    case 'Integer':
    case 'Long':
    case 'Double':
    case 'BigDecimal': return 'number';
    case 'LocalDate': return 'string';
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

export function generateBackendDTOs(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[]
): GeneratedDTOs {
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

  // Create Request DTO
  const createFields = fields.map(f => `    private ${f.type} ${f.name};`).join('\n');
  const createRequest = `package ${packageName};

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ${pascalName}CreateRequest {
${createFields}
}
`;

  // Update Request DTO (Typically excludes primary keys)
  const nonKeyFields = fields.filter(f => !f.isKey);
  const updateFieldsStr = (nonKeyFields.length > 0 ? nonKeyFields : fields)
    .map(f => `    private ${f.type} ${f.name};`)
    .join('\n');

  const updateRequest = `package ${packageName};

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ${pascalName}UpdateRequest {
${updateFieldsStr}
}
`;

  // Response DTO (Includes strictly specified fields)
  const responseFields = fields.map(f => `    private ${f.type} ${f.name};`).join('\n');
  const response = `package ${packageName};

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ${pascalName}Response {
${responseFields}
}
`;

  // Search Request DTO
  const searchFields = fields.map(f => `    private ${f.type} ${f.name};`).join('\n');
  const searchRequest = `package ${packageName};

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ${pascalName}SearchRequest {
${searchFields}
}
`;

  return { createRequest, updateRequest, response, searchRequest };
}

// Generate JPA Model Entity
export function generateBackendModel(
  moduleName: string,
  moduleType: string,
  tableName: string,
  className: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const packageName = `com.gable.um.${moduleType.toLowerCase()}.model`;
  const table = tableName || `MK_${toSnakeCase(moduleName)}`;
  const finalClassName = className || `Mk${toPascalCase(moduleName)}`;

  const classFields = fields.map(f => {
    let annotations = '';
    if (f.isKey) {
      annotations += '    @Id\n';
    }
    annotations += `    @Column(name = "${f.columnName || toSnakeCase(f.name)}")`;
    return `${annotations}\n    private ${f.type} ${f.name};`;
  }).join('\n\n');

  return `package ${packageName};

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "${table}")
public class ${finalClassName} {

${classFields}
}
`;
}

// Generate Controller
export function generateBackendController(
  moduleName: string,
  moduleType: string,
  className: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const packageName = `com.gable.um.${typeLower}.controller`;

  return `package ${packageName};

import com.gable.um.${typeLower}.service.${pascalName}Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/${typeLower}/${camelName}")
public class ${pascalName}Controller {

    private final ${pascalName}Service ${camelName}Service;

}
`;
}

// Generate JpaRepository
export function generateBackendRepository(
  moduleName: string,
  moduleType: string,
  className: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const packageName = `com.gable.um.${typeLower}.repository`;
  const finalClassName = className || `Mk${pascalName}`;
  
  const keyField = fields.find(f => f.isKey) || fields[0];
  const keyType = keyField ? keyField.type : 'String';

  return `package ${packageName};

import com.gable.um.${typeLower}.model.${finalClassName};
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Profile("oracle")
@Repository
public interface ${pascalName}Repository extends JpaRepository<${finalClassName}, ${keyType}>, ${pascalName}RepositoryCustom {
}
`;
}

// Generate Custom Repository Interface
export function generateBackendRepositoryCustom(
  moduleName: string,
  moduleType: string,
  className: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const packageName = `com.gable.um.${typeLower}.repository`;

  return `package ${packageName};

import com.gable.um.${typeLower}.dto.${pascalName}Response;
import com.gable.um.${typeLower}.dto.${pascalName}SearchRequest;
import java.util.List;

public interface ${pascalName}RepositoryCustom {

    List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request);
}
`;
}

// Generate Custom Repository Implementation
export function generateBackendRepositoryCustomImpl(
  moduleName: string,
  moduleType: string,
  tableName: string,
  className: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const packageName = `com.gable.um.${typeLower}.repository`;
  const table = tableName || `MK_${toSnakeCase(moduleName)}`;

  // Dynamic SQL column selection
  const selectColumns = fields.map(f => f.columnName || toSnakeCase(f.name)).join(', ');
  
  // Dynamic SQL query binding builders
  const queryConditions = fields.map(f => {
    const col = f.columnName || toSnakeCase(f.name);
    if (f.type === 'String') {
      return `        if (org.apache.commons.lang3.StringUtils.isNotEmpty(request.get${toPascalCase(f.name)}())) {\n` +
             `            sql.append(" AND UPPER(${col}) LIKE :${f.name} ESCAPE '\\\\' ");\n` +
             `            params.put("${f.name}", "%" + escapeLike(request.get${toPascalCase(f.name)}().toUpperCase()) + "%");\n` +
             `        }`;
    } else {
      return `        if (request.get${toPascalCase(f.name)}() != null) {\n` +
             `            sql.append(" AND ${col} = :${f.name} ");\n` +
             `            params.put("${f.name}", request.get${toPascalCase(f.name)}());\n` +
             `        }`;
    }
  }).join('\n');

  // Result mapper
  const resultMapperFields = fields.map(f => {
    let getter = 'getString';
    if (f.type === 'Integer') getter = 'getInt';
    else if (f.type === 'Long') getter = 'getLong';
    else if (f.type === 'Double') getter = 'getDouble';
    else if (f.type === 'BigDecimal') getter = 'getBigDecimal';
    else if (f.type === 'LocalDate') {
      return `                        .${f.name}(rs.getDate("${f.columnName || toSnakeCase(f.name)}") != null ? rs.getDate("${f.columnName || toSnakeCase(f.name)}").toLocalDate() : null)`;
    }
    return `                        .${f.name}(rs.get${toPascalCase(getter)}("${f.columnName || toSnakeCase(f.name)}"))`;
  }).join('\n');

  return `package ${packageName};

import com.gable.um.${typeLower}.dto.${pascalName}Response;
import com.gable.um.${typeLower}.dto.${pascalName}SearchRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Profile("oracle")
@Repository
@Slf4j
@RequiredArgsConstructor
public class ${pascalName}RepositoryCustomImpl implements ${pascalName}RepositoryCustom {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    private String escapeLike(String value) {
        if (value == null) return null;
        return value.replace("_", "\\\\_");
    }

    @Override
    public List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request) {
        Map<String, Object> params = new HashMap<>();
        StringBuilder sql = new StringBuilder();
        sql.append(" SELECT ${selectColumns} ");
        sql.append(" FROM ${table} ");
        sql.append(" WHERE 1 = 1 ");

${queryConditions}

        return namedParameterJdbcTemplate.query(sql.toString(), params, (rs, rowNum) ->
                ${pascalName}Response.builder()
${resultMapperFields}
                        .build()
        );
    }
}
`;
}

// Generate Service Interface
export function generateBackendService(
  moduleName: string,
  moduleType: string,
  className: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const packageName = `com.gable.um.${typeLower}.service`;
  
  const keyField = fields.find(f => f.isKey) || fields[0];
  const keyType = keyField ? keyField.type : 'String';
  const keyName = keyField ? keyField.name : 'id';

  return `package ${packageName};

import com.gable.um.${typeLower}.dto.${pascalName}CreateRequest;
import com.gable.um.${typeLower}.dto.${pascalName}Response;
import com.gable.um.${typeLower}.dto.${pascalName}SearchRequest;
import com.gable.um.${typeLower}.dto.${pascalName}UpdateRequest;

import java.util.List;

public interface ${pascalName}Service {

    List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request);

    ${pascalName}Response get${pascalName}ById(${keyType} ${keyName});

    void create${pascalName}(${pascalName}CreateRequest request, String userId);

    void update${pascalName}(${keyType} ${keyName}, ${pascalName}UpdateRequest request, String userId);

    void delete${pascalName}(${keyType} ${keyName}, String userId);
}
`;
}

// Generate Service Implementation
export function generateBackendServiceImpl(
  moduleName: string,
  moduleType: string,
  className: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();
  const packageName = `com.gable.um.${typeLower}.service`;
  const finalClassName = className || `Mk${pascalName}`;
  
  const keyField = fields.find(f => f.isKey) || fields[0];
  const keyType = keyField ? keyField.type : 'String';
  const keyName = keyField ? keyField.name : 'id';

  // Builder setters from CreateRequest
  const entitySetters = fields.map(f => `                .${f.name}(request.get${toPascalCase(f.name)}())`).join('\n');
  const dtoResponseBuilder = fields.map(f => `                        .${f.name}(e.get${toPascalCase(f.name)}())`).join('\n');

  // Dynamic set update fields from UpdateRequest
  const nonKeyFields = fields.filter(f => !f.isKey);
  const entityUpdateSetters = (nonKeyFields.length > 0 ? nonKeyFields : fields)
    .map(f => `        entity.set${toPascalCase(f.name)}(request.get${toPascalCase(f.name)}());`)
    .join('\n');

  return `package ${packageName};

import com.gable.um.exception.BusinessException;
import com.gable.um.${typeLower}.dto.${pascalName}CreateRequest;
import com.gable.um.${typeLower}.dto.${pascalName}Response;
import com.gable.um.${typeLower}.dto.${pascalName}SearchRequest;
import com.gable.um.${typeLower}.dto.${pascalName}UpdateRequest;
import com.gable.um.${typeLower}.model.${finalClassName};
import com.gable.um.${typeLower}.repository.${pascalName}Repository;
import com.gable.um.util.MessageUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ${pascalName}ServiceImpl implements ${pascalName}Service {

    private final ${pascalName}Repository ${camelName}Repository;

    @Override
    @Transactional(readOnly = true)
    public List<${pascalName}Response> search${pascalName}(${pascalName}SearchRequest request) {
        return ${camelName}Repository.search${pascalName}(request);
    }

    @Override
    @Transactional(readOnly = true)
    public ${pascalName}Response get${pascalName}ById(${keyType} ${keyName}) {
        Optional<${finalClassName}> opt = ${camelName}Repository.findById(${keyName});
        return opt.map(e -> ${pascalName}Response.builder()
${dtoResponseBuilder}
                        .build())
                .orElse(null);
    }

    @Override
    public void create${pascalName}(${pascalName}CreateRequest request, String userId) {
        ${finalClassName} entity = ${finalClassName}.builder()
${entitySetters}
                .build();
        ${camelName}Repository.save(entity);
    }

    @Override
    public void update${pascalName}(${keyType} ${keyName}, ${pascalName}UpdateRequest request, String userId) {
        ${finalClassName} entity = ${camelName}Repository.findById(${keyName})
                .orElseThrow(() -> new BusinessException(MessageUtils.getMessageFromMsgCode("EC003")));

${entityUpdateSetters}
        
        ${camelName}Repository.save(entity);
    }

    @Override
    public void delete${pascalName}(${keyType} ${keyName}, String userId) {
        if (!${camelName}Repository.existsById(${keyName})) {
            throw new BusinessException(MessageUtils.getMessageFromMsgCode("EC003"));
        }
        ${camelName}Repository.deleteById(${keyName});
    }
}
`;
}

// Generate Frontend Model/Schema
export function generateFrontendModel(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[]
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);

  const modelFieldsStr = fields.map(f => `  ${f.name}?: ${mapJavaTypeToTs(f.type)};`).join('\n');
  
  const fieldsObjectFields = fields.map(f => `  ${toSnakeCase(f.name)}: "${f.name}",`).join('\n');

  const createFieldsStr = fields.map(f => `  ${f.name}?: ${mapJavaTypeToTs(f.type)};`).join('\n');
  const updateFieldsStr = fields.filter(f => !f.isKey).map(f => `  ${f.name}?: ${mapJavaTypeToTs(f.type)};`).join('\n');

  return `export interface ${pascalName}Model {
${modelFieldsStr}
}

export const ${pascalName}ModelFields = {
${fieldsObjectFields}
};

export interface ${pascalName}CreateModel {
${createFieldsStr}
}

export interface ${pascalName}UpdateModel {
${updateFieldsStr}
}
`;
}

// Generate Frontend Service
export function generateFrontendService(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[]
): string {
  const camelName = toCamelCase(moduleName);
  const typeUpper = moduleType.toUpperCase();

  return `import { Constants } from "@/_helpers/constants";
import axios from "@/utils/axiosInstance";

export const ${toSnakeCase(moduleName)}_URL = \`\${Constants.URL_${typeUpper}}/${camelName}\`;

export const ${camelName}Service = {
  // Methods to be declared based on features
};
`;
}

// Helper to map parameter types to appropriate Input elements
function getFieldInputTemplate(f: FieldDefinition): string {
  let label = toPascalCase(f.name);
  label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  if (f.type === 'Boolean') {
    return `                        <CheckboxForm\n` +
           `                            fieldName="${f.name}"\n` +
           `                            label="${label}"\n` +
           `                            form={inputForm}\n` +
           `                        />`;
  } else if (f.type === 'LocalDate') {
    return `                        <CalendarForm\n` +
           `                            fieldName="${f.name}"\n` +
           `                            label="${label}"\n` +
           `                            form={inputForm}\n` +
           `                        />`;
  } else if (['Integer', 'Long', 'Double', 'BigDecimal'].includes(f.type)) {
    return `                        <InputForm\n` +
           `                            type="number"\n` +
           `                            fieldName="${f.name}"\n` +
           `                            label="${label}"\n` +
           `                            form={inputForm}\n` +
           `                        />`;
  } else {
    return `                        <InputForm\n` +
           `                            fieldName="${f.name}"\n` +
           `                            label="${label}"\n` +
           `                            form={inputForm}\n` +
           `                        />`;
  }
}

// Helper to determine which form components to import
function getFormImports(fields: FieldDefinition[], extraImports: string[] = []): string {
  const imports = new Set<string>(extraImports);
  fields.forEach(f => {
    if (f.type === 'Boolean') imports.add('CheckboxForm');
    else if (f.type === 'LocalDate') imports.add('CalendarForm');
    else imports.add('InputForm');
  });
  return Array.from(imports).sort().join(',\n  ');
}

// Generate Frontend Page View Component
export function generateFrontendComponent(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  buttons: ButtonsSelection
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);

  // Form zod schema definition
  const zodFields = fields.map(f => {
    if (f.type === 'String') {
      return `    ${f.name}: z.string({ required_error: "Required field" }).min(1, { message: "Required field" })`;
    } else if (f.type === 'Boolean') {
      return `    ${f.name}: z.any().optional()`;
    } else if (f.type === 'LocalDate') {
      return `    ${f.name}: z.any().optional()`;
    } else {
      return `    ${f.name}: z.number().optional()`;
    }
  }).join(',\n');

  // Input default values mapping
  const defaults = fields.map(f => {
    if (f.type === 'Boolean') return `        ${f.name}: false`;
    if (f.type === 'LocalDate') return `        ${f.name}: null`;
    return `        ${f.name}: ""`;
  }).join(',\n');

  // Dynamically map input components
  const formInputs = fields.map(f => getFieldInputTemplate(f)).join('\n');

  // Get dynamic imports list
  const neededImports = getFormImports(fields, ['CustomButton', 'CustomCard', 'FormInput']);

  // Generate buttons array
  const renderedButtons: string[] = [];
  let colsCount = 0;

  if (buttons.search) {
    renderedButtons.push(
      `                                <CustomButton\n` +
      `                                    labelId="BUTTON.SEARCH"\n` +
      `                                    type="submit"\n` +
      `                                />`
    );
    colsCount++;
  }
  if (buttons.clear) {
    renderedButtons.push(
      `                                <CustomButton\n` +
      `                                    labelId="BUTTON.CLEAR"\n` +
      `                                    onClick={() => inputForm.reset(defaultInput)}\n` +
      `                                />`
    );
    colsCount++;
  }
  if (buttons.save) {
    renderedButtons.push(
      `                                <CustomButton\n` +
      `                                    labelId="BUTTON.SAVE"\n` +
      `                                    onClick={onSave}\n` +
      `                                />`
    );
    colsCount++;
  }
  if (buttons.add) {
    renderedButtons.push(
      `                                <CustomButton\n` +
      `                                    labelId="BUTTON.ADD"\n` +
      `                                    onClick={onAdd}\n` +
      `                                />`
    );
    colsCount++;
  }
  if (buttons.close) {
    renderedButtons.push(
      `                                <CustomButton\n` +
      `                                    labelId="BUTTON.CLOSE"\n` +
      `                                    onClick={onClose}\n` +
      `                                />`
    );
    colsCount++;
  }

  const buttonsGroup = renderedButtons.join('\n');
  const colsClass = `grid-cols-${colsCount || 1}`;

  return `"use client"\n` +
    `import {\n` +
    `  ${neededImports}\n` +
    `} from '@/components/layout/Form'\n` +
    `import { Box } from "@radix-ui/themes"\n` +
    `import { zodResolver } from '@hookform/resolvers/zod'\n` +
    `import React from 'react'\n` +
    `import { useForm } from 'react-hook-form'\n` +
    `import { z } from 'zod'\n\n` +
    `const inputSchema = z.object({\n` +
    `${zodFields}\n` +
    `})\n\n` +
    `const defaultInput = {\n` +
    `${defaults}\n` +
    `}\n\n` +
    `const ${pascalName}Page = () => {\n` +
    `    const inputForm = useForm<z.infer<typeof inputSchema>>({\n` +
    `        resolver: zodResolver(inputSchema),\n` +
    `        defaultValues: defaultInput\n` +
    `    })\n\n` +
    `    const onSubmit = (data: z.infer<typeof inputSchema>) => {\n` +
    `        console.log("Submit Form Data:", data)\n` +
    `    }\n\n` +
    `${buttons.save ? `    const onSave = () => {\n        console.log("Save action clicked")\n    }\n\n` : ''}` +
    `${buttons.add ? `    const onAdd = () => {\n        console.log("Add action clicked")\n    }\n\n` : ''}` +
    `${buttons.close ? `    const onClose = () => {\n        console.log("Close action clicked")\n    }\n\n` : ''}` +
    `    return (\n` +
    `        <div className='flex flex-col h-full w-full bg-muted'>\n` +
    `            <Box className='w-[70rem] mx-auto p-6 md:p-10'>\n` +
    `                <CustomCard\n` +
    `                    header='Manage ${pascalName}'\n` +
    `                    className='w-full h-fit'\n` +
    `                >\n` +
    `                    <FormInput\n` +
    `                        id="${camelName}Form"\n` +
    `                        form={inputForm}\n` +
    `                        onSubmit={onSubmit}\n` +
    `                    >\n` +
    `                        <div className="grid auto-rows-min gap-4 md:grid-cols-2">\n` +
    `${formInputs}\n` +
    `                        </div>\n\n` +
    `                        <div className='flex justify-center pt-6'>\n` +
    `                            <div className='grid w-fit gap-2 justify-center items-center md:${colsClass}'>\n` +
    `${buttonsGroup}\n` +
    `                            </div>\n` +
    `                        </div>\n` +
    `                    </FormInput>\n` +
    `                </CustomCard>\n` +
    `            </Box>\n` +
    `        </div>\n` +
    `    )\n` +
    `}\n\n` +
    `export default ${pascalName}Page;\n`;
}

// Generate Search Page Component (combines search form, results grid table, and popup details trigger)
export function generateFrontendSearchComponent(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  buttons: ButtonsSelection
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();

  const keyField = fields.find(f => f.isKey) || fields[0];
  const keyFieldName = keyField ? keyField.name : 'id';

  // Dynamic search fields (use first 3 fields as search criteria)
  const searchFields = fields.slice(0, 3);
  const dynamicFormsStr = searchFields.map(f => {
    const label = f.label && f.label.trim() !== '' ? f.label.trim() : toPascalCase(f.name).replace(/([a-z])([A-Z])/g, '$1 $2');
    if (f.type === 'Boolean') {
      return `    {\n` +
             `      fieldName: "${f.name}",\n` +
             `      label: "${label}",\n` +
             `      type: "checkbox",\n` +
             `    }`;
    } else if (f.type === 'LocalDate') {
      return `    {\n` +
             `      fieldName: "${f.name}",\n` +
             `      label: "${label}",\n` +
             `      type: "calendar",\n` +
             `    }`;
    } else {
      return `    {\n` +
             `      fieldName: "${f.name}",\n` +
             `      label: "${label}",\n` +
             `      type: "text",\n` +
             `      maxLength: ${['Integer', 'Long', 'Double', 'BigDecimal'].includes(f.type) ? 20 : 100},\n` +
             `    }`;
    }
  }).join(',\n');

  // Form buttons
  const formButtonsStr = `    {\n` +
                         `      labelId: "BUTTON.SEARCH",\n` +
                         `      type: "submit",\n` +
                         `      showButton: true,\n` +
                         `    },\n` +
                         `    {\n` +
                         `      labelId: "BUTTON.CLEAR",\n` +
                         `      type: "reset",\n` +
                         `      bgColor: "secondary",\n` +
                         `      showButton: true,\n` +
                         `      onClick: onClear,\n` +
                         `    },\n` +
                         `    {\n` +
                         `      labelId: "BUTTON.ADD",\n` +
                         `      type: "button",\n` +
                         `      showButton: true,\n` +
                         `      onClick: handleAddAction,\n` +
                         `    }`;

  return `"use client";\n\n` +
    `import { useEffect, useState } from "react";\n` +
    `import { useForm } from "react-hook-form";\n` +
    `import { z } from "zod";\n` +
    `import { zodResolver } from "@hookform/resolvers/zod";\n` +
    `import { ${pascalName}Model } from "@/_models/${typeLower}/${camelName}.model";\n` +
    `import {\n` +
    `  ${pascalName}SearchSchema,\n` +
    `  default${pascalName}SearchValues,\n` +
    `} from "./schemas/${camelName}SearchSchema";\n` +
    `import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}.service";\n` +
    `import { ${pascalName}TableColumns } from "./tables/${camelName}Table";\n` +
    `import { useLoading } from "@/_providers/loader-provider";\n` +
    `import {\n` +
    `  AlertType,\n` +
    `  ColPinTable,\n` +
    `  CustomCard,\n` +
    `} from "@/components/layout/Form";\n` +
    `import { AlertWording, useAlert } from "@/_providers/alert-provider";\n` +
    `import BoxContainer from "@/components/ui/box-container";\n` +
    `import DynamicForm, {\n` +
    `  ButtonConfig,\n` +
    `  DynamicField,\n` +
    `} from "@/components/layout/Form/dynamic-form-builder";\n` +
    `import { FormHelper } from "@/_helpers/form-helper";\n` +
    `import ${pascalName}FormModal from "./pop-ups/${camelName}-form-modal";\n` +
    `import { MODE } from "@/_configs/mode-configs/mode-config";\n\n` +
    `const ${pascalName} = () => {\n` +
    `  const header = "หน้าจอสอบถามข้อมูล ${pascalName}";\n\n` +
    `  const [showResult, setShowResult] = useState<boolean>(false);\n` +
    `  const [dataTable, setDataTable] = useState<${pascalName}Model[]>([]);\n` +
    `  const [modalOpen, setModalOpen] = useState<boolean>(false);\n` +
    `  const [modalMode, setModalMode] = useState<MODE>(MODE.ADD);\n` +
    `  const [modalEditData, setModalEditData] = useState<${pascalName}Model | null>(null);\n\n` +
    `  const { errorAlert, openAlert, openConfirmAlert, successToast } = useAlert();\n` +
    `  const loading = useLoading((state) => state.loading);\n` +
    `  const setLoading = useLoading((state) => state.setLoading);\n\n` +
    `  const searchForm = useForm<z.infer<typeof ${pascalName}SearchSchema>>({\n` +
    `    resolver: zodResolver(${pascalName}SearchSchema),\n` +
    `    defaultValues: default${pascalName}SearchValues,\n` +
    `    mode: "onChange",\n` +
    `  });\n\n` +
    `  const onSearch = (): void => {\n` +
    `    if (loading) return;\n` +
    `    setLoading(true);\n` +
    `    fetchDataTable();\n` +
    `  };\n\n` +
    `  const fetchDataTable = async () => {\n` +
    `    const searchValues = searchForm.getValues();\n` +
    `    const normalizedValues = FormHelper.normalizeSearchParams<${pascalName}Model>({\n` +
    `      ...searchValues,\n` +
    `    });\n` +
    `    try {\n` +
    `      const res = await ${camelName}Service.search${pascalName}(\n` +
    `        normalizedValues as ${pascalName}Model,\n` +
    `      );\n` +
    `      if (res.data?.status && res.data?.object) {\n` +
    `        setDataTable(res.data.object);\n` +
    `        setShowResult(true);\n` +
    `      } else {\n` +
    `        openAlert(res.data.messageLocal, AlertType.WARNING);\n` +
    `        setDataTable([]);\n` +
    `      }\n` +
    `    } catch (err) {\n` +
    `      errorAlert(err);\n` +
    `    } finally {\n` +
    `      setLoading(false);\n` +
    `    }\n` +
    `  };\n\n` +
    `  const onClear = () => {\n` +
    `    searchForm.reset(default${pascalName}SearchValues);\n` +
    `    setShowResult(false);\n` +
    `    setDataTable([]);\n` +
    `  };\n\n` +
    `  const handleAddAction = () => {\n` +
    `    setModalMode(MODE.ADD);\n` +
    `    setModalEditData(null);\n` +
    `    setModalOpen(true);\n` +
    `  };\n\n` +
    `  const handleEditAction = (data: ${pascalName}Model) => {\n` +
    `    setModalMode(MODE.EDIT);\n` +
    `    setModalEditData(data);\n` +
    `    setModalOpen(true);\n` +
    `  };\n\n` +
    `  const handleDeleteAction = (data: ${pascalName}Model) => {\n` +
    `    openConfirmAlert(\n` +
    `      AlertWording.DELETE,\n` +
    `      () => {\n` +
    `        confirmDelete(data);\n` +
    `      },\n` +
    `      AlertType.WARNING,\n` +
    `    );\n` +
    `  };\n\n` +
    `  const confirmDelete = async (data: ${pascalName}Model) => {\n` +
    `    if (loading) return;\n` +
    `    if (!data.${keyFieldName}) return;\n` +
    `    setLoading(true);\n` +
    `    try {\n` +
    `      const res = await ${camelName}Service.delete${pascalName}(data.${keyFieldName});\n` +
    `      if (res.data?.status) {\n` +
    `        successToast(res.data.messageLocal);\n` +
    `        await fetchDataTable();\n` +
    `      } else {\n` +
    `        openAlert(res.data.messageLocal, AlertType.WARNING);\n` +
    `      }\n` +
    `    } catch (err) {\n` +
    `      errorAlert(err);\n` +
    `    } finally {\n` +
    `      setLoading(false);\n` +
    `    }\n` +
    `  };\n\n` +
    `  const handleModalSaved = () => {\n` +
    `    fetchDataTable();\n` +
    `  };\n\n` +
    `  const tableColumns = ${pascalName}TableColumns.GetColumns(\n` +
    `    handleEditAction,\n` +
    `    handleDeleteAction,\n` +
    `  );\n\n` +
    `  const dynamicForms: DynamicField[] = [\n` +
    `${dynamicFormsStr}\n` +
    `  ];\n\n` +
    `  const formButtons: ButtonConfig[] = [\n` +
    `${formButtonsStr}\n` +
    `  ];\n\n` +
    `  return (\n` +
    `    <div className="bg-muted flex flex-col h-full w-full">\n` +
    `      <div className="flex flex-row w-full p-6 pb-0 md:p-10 md:pb-0">\n` +
    `        <CustomCard header={header} className="w-full h-fit">\n` +
    `          <BoxContainer>\n` +
    `            <DynamicForm\n` +
    `              inputFormControl={searchForm}\n` +
    `              formId="searchForm"\n` +
    `              fields={dynamicForms}\n` +
    `              buttons={formButtons}\n` +
    `              onSubmit={onSearch}\n` +
    `              columnsNo="2"\n` +
    `              buttonColumnsNo="3"\n` +
    `            />\n` +
    `          </BoxContainer>\n` +
    `          {showResult && (\n` +
    `            <div className="grid auto-rows-min gap-4 mt-4">\n` +
    `              <ColPinTable\n` +
    `                title="ตารางข้อมูล ${pascalName}"\n` +
    `                data={dataTable}\n` +
    `                columns={tableColumns}\n` +
    `              />\n` +
    `            </div>\n` +
    `          )}\n` +
    `        </CustomCard>\n` +
    `      </div>\n` +
    `      <${pascalName}FormModal\n` +
    `        open={modalOpen}\n` +
    `        setOpen={setModalOpen}\n` +
    `        mode={modalMode}\n` +
    `        editData={modalEditData}\n` +
    `        onSaved={handleModalSaved}\n` +
    `      />\n` +
    `    </div>\n` +
    `  );\n` +
    `};\n\n` +
    `export default ${pascalName};\n`;
}

// Generate Detail Component (input details for modal / dialog)
export function generateFrontendDetailComponent(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  buttons: ButtonsSelection
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();

  const keyField = fields.find(f => f.isKey) || fields[0];
  const keyFieldName = keyField ? keyField.name : 'id';

  // Map fields to DynamicField items
  const dynamicFieldsStr = fields.map(f => {
    const label = f.label && f.label.trim() !== '' ? f.label.trim() : toPascalCase(f.name).replace(/([a-z])([A-Z])/g, '$1 $2');
    let extra = '';
    if (f.isKey) {
      extra += `,\n      disable: mode === MODE.EDIT`;
    }
    if (f.type === 'Boolean') {
      return `    {\n` +
             `      type: 'checkbox',\n` +
             `      fieldName: '${f.name}',\n` +
             `      label: '${label}'${extra}\n` +
             `    }`;
    } else if (f.type === 'LocalDate') {
      return `    {\n` +
             `      type: 'calendar',\n` +
             `      fieldName: '${f.name}',\n` +
             `      label: '${label}',\n` +
             `      isRequired: true${extra}\n` +
             `    }`;
    } else {
      return `    {\n` +
             `      type: 'text',\n` +
             `      fieldName: '${f.name}',\n` +
             `      label: '${label}',\n` +
             `      isRequired: true,\n` +
             `      maxLength: ${['Integer', 'Long', 'Double', 'BigDecimal'].includes(f.type) ? 20 : 100}${extra}\n` +
             `    }`;
    }
  }).join(',\n');

  // Modal Save button, Clear, Close
  const modalButtons = `    {\n` +
                       `      labelId: "BUTTON.SAVE",\n` +
                       `      type: "button",\n` +
                       `      showButton: true,\n` +
                       `      onClick: handleSave,\n` +
                       `    },\n` +
                       `    {\n` +
                       `      labelId: "BUTTON.CLEAR",\n` +
                       `      type: "button",\n` +
                       `      bgColor: "secondary",\n` +
                       `      showButton: true,\n` +
                       `      onClick: handleClear,\n` +
                       `    },\n` +
                       `    {\n` +
                       `      labelId: "BUTTON.CLOSE",\n` +
                       `      type: "button",\n` +
                       `      bgColor: "secondary",\n` +
                       `      showButton: true,\n` +
                       `      onClick: handleClose,\n` +
                       `    }`;

  const bodyCreateFields = fields.map(f => `          ${f.name}: values.${f.name},`).join('\n');
  const bodyUpdateFields = fields.filter(f => !f.isKey).map(f => `          ${f.name}: values.${f.name},`).join('\n');

  return `"use client";\n\n` +
    `import { useEffect } from "react";\n` +
    `import { useForm } from "react-hook-form";\n` +
    `import { z } from "zod";\n` +
    `import { zodResolver } from "@hookform/resolvers/zod";\n` +
    `import {\n` +
    `  ${pascalName}CreateModel,\n` +
    `  ${pascalName}Model,\n` +
    `  ${pascalName}UpdateModel,\n` +
    `} from "@/_models/${typeLower}/${camelName}.model";\n` +
    `import {\n` +
    `  ${pascalName}FormSchema,\n` +
    `  default${pascalName}FormValues,\n` +
    `} from "../schemas/${camelName}FormSchema";\n` +
    `import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}.service";\n` +
    `import { AlertType } from "@/components/layout/Form";\n` +
    `import { CustomDialog } from "@/components/layout/Form/CustomDialog";\n` +
    `import DynamicForm, {\n` +
    `  ButtonConfig,\n` +
    `  DynamicField,\n` +
    `} from "@/components/layout/Form/dynamic-form-builder";\n` +
    `import BoxContainer from "@/components/ui/box-container";\n` +
    `import { AlertWording, useAlert } from "@/_providers/alert-provider";\n` +
    `import { useLoading } from "@/_providers/loader-provider";\n` +
    `import { MODE } from "@/_configs/mode-configs/mode-config";\n\n` +
    `interface ${pascalName}FormModalProps {\n` +
    `  open: boolean;\n` +
    `  setOpen: (open: boolean) => void;\n` +
    `  mode: MODE;\n` +
    `  editData: ${pascalName}Model | null;\n` +
    `  onSaved: () => void;\n` +
    `}\n\n` +
    `const ${pascalName}FormModal = ({\n` +
    `  open,\n` +
    `  setOpen,\n` +
    `  mode,\n` +
    `  editData,\n` +
    `  onSaved,\n` +
    `}: ${pascalName}FormModalProps) => {\n` +
    `  const title = "ข้อมูล ${pascalName}";\n\n` +
    `  const { errorAlert, openConfirmAlert, successToast } = useAlert();\n` +
    `  const loading = useLoading((state) => state.loading);\n` +
    `  const setLoading = useLoading((state) => state.setLoading);\n\n` +
    `  const modalForm = useForm<z.infer<typeof ${pascalName}FormSchema>>({\n` +
    `    resolver: zodResolver(${pascalName}FormSchema),\n` +
    `    defaultValues: default${pascalName}FormValues,\n` +
    `    mode: "onChange",\n` +
    `  });\n\n` +
    `  useEffect(() => {\n` +
    `    if (!open) return;\n` +
    `    if (mode === MODE.EDIT && editData) {\n` +
    `      modalForm.reset({\n` +
    `        ...editData as any\n` +
    `      });\n` +
    `    } else if (mode === MODE.ADD) {\n` +
    `      modalForm.reset(default${pascalName}FormValues);\n` +
    `    }\n` +
    `  }, [open, mode, editData]);\n\n` +
    `  const handleSave = async () => {\n` +
    `    const isValid = await modalForm.trigger();\n` +
    `    if (!isValid) return;\n\n` +
    `    const wording = mode === MODE.ADD ? AlertWording.SAVE : AlertWording.EDIT;\n` +
    `    openConfirmAlert(\n` +
    `      wording,\n` +
    `      () => {\n` +
    `        void submitSave();\n` +
    `      },\n` +
    `      AlertType.SAVE,\n` +
    `    );\n` +
    `  };\n\n` +
    `  const submitSave = async () => {\n` +
    `    if (loading) return;\n` +
    `    setLoading(true);\n` +
    `    try {\n` +
    `      const values = modalForm.getValues();\n` +
    `      if (mode === MODE.ADD) {\n` +
    `        const body: ${pascalName}CreateModel = {\n` +
    `${bodyCreateFields}\n` +
    `        };\n` +
    `        const res = await ${camelName}Service.create${pascalName}(body);\n` +
    `        if (res.data?.status) {\n` +
    `          successToast(res.data.messageLocal);\n` +
    `          setOpen(false);\n` +
    `          onSaved();\n` +
    `        } else {\n` +
    `          errorAlert(res.data?.messageLocal);\n` +
    `        }\n` +
    `      } else {\n` +
    `        const body: ${pascalName}UpdateModel = {\n` +
    `${bodyUpdateFields}\n` +
    `        };\n` +
    `        const res = await ${camelName}Service.update${pascalName}(\n` +
    `          values.${keyFieldName} ?? "",\n` +
    `          body,\n` +
    `        );\n` +
    `        if (res.data?.status) {\n` +
    `          successToast(res.data.messageLocal);\n` +
    `          setOpen(false);\n` +
    `          onSaved();\n` +
    `        } else {\n` +
    `          errorAlert(res.data?.messageLocal);\n` +
    `        }\n` +
    `      }\n` +
    `    } catch (err) {\n` +
    `      errorAlert(err);\n` +
    `    } finally {\n` +
    `      setLoading(false);\n` +
    `    }\n` +
    `  };\n\n` +
    `  const handleClear = () => {\n` +
    `    if (mode === MODE.ADD) {\n` +
    `      modalForm.reset(default${pascalName}FormValues);\n` +
    `    } else if (mode === MODE.EDIT && editData) {\n` +
    `      modalForm.reset({\n` +
    `        ...editData as any\n` +
    `      });\n` +
    `    }\n` +
    `  };\n\n` +
    `  const handleClose = () => {\n` +
    `    openConfirmAlert(\n` +
    `      AlertWording.CANCEL,\n` +
    `      () => {\n` +
    `        modalForm.reset(default${pascalName}FormValues);\n` +
    `        setOpen(false);\n` +
    `      },\n` +
    `      AlertType.WARNING,\n` +
    `    );\n` +
    `  };\n\n` +
    `  const modalFields: DynamicField[] = [\n` +
    `${dynamicFieldsStr}\n` +
    `  ];\n\n` +
    `  const modalButtons: ButtonConfig[] = [\n` +
    `${modalButtons}\n` +
    `  ];\n\n` +
    `  return (\n` +
    `    <CustomDialog\n` +
    `      open={open}\n` +
    `      onOpenChange={(val) => {\n` +
    `        if (!val) handleClose();\n` +
    `      }}\n` +
    `      title={title}\n` +
    `      size="lg"\n` +
    `      buttons={modalButtons}\n` +
    `      buttonColumnsNo="3"\n` +
    `    >\n` +
    `      <BoxContainer variant="compact">\n` +
    `        <DynamicForm\n` +
    `          inputFormControl={modalForm}\n` +
    `          formId="${camelName}FormModal"\n` +
    `          fields={modalFields}\n` +
    `          columnsNo="1"\n` +
    `        />\n` +
    `      </BoxContainer>\n` +
    `    </CustomDialog>\n` +
    `  );\n` +
    `};\n\n` +
    `export default ${pascalName}FormModal;\n`;
}

// Generate Frontend Report View Component (using DynamicForm and crystal-report/jasper-report helpers)
export function generateFrontendReportComponent(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[],
  buttons: ButtonsSelection,
  reportFileName: string,
  reportEngine: 'direct' | 'crystal' | 'jasper' = 'direct'
): string {
  if (!fields || fields.length === 0) {
    return '// Add at least one field to generate code.';
  }

  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();

  const finalReportName = reportFileName || (toCamelCase(moduleName) + 'Report');
  const camelReportName = toCamelCase(finalReportName);
  const pascalReportName = toPascalCase(finalReportName);
  const kebabReportName = toKebabCase(finalReportName);

  // Map fields to DynamicField items
  const dynamicFieldsStr = fields.map(f => {
    const label = f.label && f.label.trim() !== '' ? f.label.trim() : toPascalCase(f.name).replace(/([a-z])([A-Z])/g, '$1 $2');
    if (f.name.toLowerCase().endsWith('status') || f.name.toLowerCase() === 'status') {
      return `    {\n` +
             `      type: 'select',\n` +
             `      fieldName: '${f.name}',\n` +
             `      label: '${label}',\n` +
             `      options: dropdowns.${f.name}Options,\n` +
             `      isRequired: ${f.isKey ? 'true' : 'false'},\n` +
             `    }`;
    } else if (f.type === 'Boolean') {
      return `    {\n` +
             `      type: 'checkbox',\n` +
             `      fieldName: '${f.name}',\n` +
             `      label: '${label}',\n` +
             `    }`;
    } else if (f.type === 'LocalDate') {
      return `    {\n` +
             `      type: 'calendar',\n` +
             `      fieldName: '${f.name}',\n` +
             `      label: '${label}',\n` +
             `    }`;
    } else {
      return `    {\n` +
             `      type: 'text',\n` +
             `      fieldName: '${f.name}',\n` +
             `      label: '${label}',\n` +
             `      maxLength: ${['Integer', 'Long', 'Double', 'BigDecimal'].includes(f.type) ? 20 : 100},\n` +
             `    }`;
    }
  }).join(',\n');

  // Status dropdown config if status exists
  const statusField = fields.find(f => f.name.toLowerCase().endsWith('status') || f.name.toLowerCase() === 'status');
  const dropdownState = statusField 
    ? `  const [dropdowns, setDropdowns] = useState({\n` +
      `    ${statusField.name}Options: [] as DropdownModel[],\n` +
      `  });`
    : `  const [dropdowns, setDropdowns] = useState({\n` +
      `    statusOptions: [] as DropdownModel[],\n` +
      `  });`;

  const dropdownFetch = statusField
    ? `  useEffect(() => {\n` +
      `    Promise.all([\n` +
      `      dropdownService.getCtSysConfigDropdown("MK103", { showCode: true, required: false }),\n` +
      `    ])\n` +
      `      .then(([statusRes]) => {\n` +
      `        setDropdowns(() => ({\n` +
      `          ${statusField.name}Options: (statusRes.data ?? []).filter(\n` +
      `            (option) => option.value !== null && option.value !== ""\n` +
      `          ),\n` +
      `        }));\n` +
      `      })\n` +
      `      .catch((err) => {\n` +
      `        errorAlert(err);\n` +
      `      });\n` +
      `  }, [errorAlert]);`
    : `  useEffect(() => {\n` +
      `    // Fetch dropdown values if needed\n` +
      `  }, [errorAlert]);`;

  // Buttons configurations
  const renderedButtons: string[] = [];
  if (buttons.print) {
    renderedButtons.push(`    { labelId: "BUTTON.PRINT", type: "submit", showButton: true },`);
  }
  if (buttons.clear) {
    renderedButtons.push(`    { labelId: "BUTTON.CLEAR", type: "button", showButton: true, onClick: onClear },`);
  }
  if (buttons.close) {
    renderedButtons.push(`    { labelId: "BUTTON.CLOSE", type: "button", showButton: true, onClick: onClose },`);
  }
  const buttonsGroup = renderedButtons.join('\n');

  const hasDate = fields.some(f => f.type === 'LocalDate');

  // Conditionally build imports
  let reportImports = '';
  if (reportEngine === 'crystal') {
    reportImports += `import CrystalReportModal from "@/components/hpls/report/shared/crystalReportModal";\n`;
  } else if (reportEngine === 'jasper') {
    reportImports += `import JasperReportModal from "@/components/hpls/report/shared/jasperReportModal";\n`;
  }
  if (hasDate && reportEngine !== 'direct') {
    reportImports += `import dayjs from "dayjs";\n`;
  }

  let directImports = '';
  if (reportEngine === 'direct') {
    directImports += `import { ${camelName}Service } from "@/_service/${typeLower}/${camelName}.service";\n` +
                     `import { loadingStore, useLoading } from "@/_providers/loader-provider";\n` +
                     `import { FormHelper } from "@/_helpers/form-helper";\n` +
                     `import { downloadBlob, resolveReportFileName } from "@/_helpers/crystal-report-helper";\n`;
  }

  let stateDeclarations = '';
  if (reportEngine === 'direct') {
    stateDeclarations += `  const setLoading = useLoading((s) => s.setLoading);`;
  } else if (reportEngine === 'crystal') {
    stateDeclarations += `  const [reportOpen, setReportOpen] = useState<boolean>(false);\n` +
                         `  const [reportBaseParams, setReportBaseParams] = useState<unknown[]>([]);`;
  } else if (reportEngine === 'jasper') {
    stateDeclarations += `  const [reportOpen, setReportOpen] = useState<boolean>(false);\n` +
                         `  const [reportParams, setReportParams] = useState<Record<string, string>>({});`;
  }

  let submitAction = '';
  let formSubmitHandlerName = 'onExport';
  if (reportEngine === 'direct') {
    formSubmitHandlerName = 'onExport';
    submitAction = `  const onExport = async (rawValues: z.infer<typeof ${pascalReportName}Schema>) => {\n` +
                   `    if (loadingStore.getState().loading) {\n` +
                   `      return;\n` +
                   `    }\n\n` +
                   `    const values = FormHelper.normalizeSearchParams(rawValues) as any;\n\n` +
                   `    setLoading(true);\n` +
                   `    try {\n` +
                   `      const res = await ${camelName}Service.export${pascalName}Report(values);\n` +
                   `      const fileName = resolveReportFileName('${pascalName} Report', 'xlsx', res.headers?.["content-disposition"]);\n` +
                   `      const blob = new Blob([res.data], { type: "application/octet-stream" });\n` +
                   `      downloadBlob(blob, fileName);\n` +
                   `    } catch (err) {\n` +
                   `      errorAlert(err);\n` +
                   `    } finally {\n` +
                   `      setLoading(false);\n` +
                   `    }\n` +
                   `  };`;
  } else if (reportEngine === 'crystal') {
    formSubmitHandlerName = 'onPrint';
    const crystalParamsList = fields.map(f => {
      if (f.type === 'LocalDate') {
        return `      fmt(rawValues.${f.name}, "")`;
      } else {
        return `      rawValues.${f.name} || "default"`;
      }
    }).join(',\n');
    submitAction = `  const onPrint = (rawValues: z.infer<typeof ${pascalReportName}Schema>) => {\n` +
                   `    const fmt = (d?: any, fallback = "default") =>\n` +
                   `      d ? dayjs(d).format("DD/MM/YYYY") : fallback;\n` +
                   `    setReportBaseParams([\n` +
                   `${crystalParamsList}\n` +
                   `    ]);\n` +
                   `    setReportOpen(true);\n` +
                   `  };`;
  } else if (reportEngine === 'jasper') {
    formSubmitHandlerName = 'onPrint';
    const jasperParamsList = fields.map(f => {
      if (f.type === 'LocalDate') {
        return `      ${f.name}: rawValues.${f.name} ? dayjs(rawValues.${f.name}).format("DD/MM/YYYY") : ""`;
      } else if (f.type === 'Boolean') {
        return `      ${f.name}: rawValues.${f.name} || "N"`;
      } else {
        return `      ${f.name}: rawValues.${f.name} != null ? String(rawValues.${f.name}) : ""`;
      }
    }).join(',\n');
    submitAction = `  const onPrint = (rawValues: z.infer<typeof ${pascalReportName}Schema>) => {\n` +
                   `    setReportParams({\n` +
                   `${jasperParamsList}\n` +
                   `    });\n` +
                   `    setReportOpen(true);\n` +
                   `  };`;
  }

  // Close callback if exists
  const closeAction = buttons.close
    ? `\n\n  const onClose = () => {\n` +
      `    console.log("Close report clicked");\n` +
      `  }`
    : '';

  let reportModalComponent = '';
  if (reportEngine === 'crystal') {
    reportModalComponent = `\n      <CrystalReportModal\n` +
                           `        open={reportOpen}\n` +
                           `        onOpenChange={setReportOpen}\n` +
                           `        reportName="${reportFileName}"\n` +
                           `        baseParams={reportBaseParams}\n` +
                           `        title={header}\n` +
                           `      />`;
  } else if (reportEngine === 'jasper') {
    reportModalComponent = `\n      <JasperReportModal\n` +
                           `        open={reportOpen}\n` +
                           `        onOpenChange={setReportOpen}\n` +
                           `        reportCode="${reportFileName}"\n` +
                           `        params={reportParams}\n` +
                           `        title={header}\n` +
                           `      />`;
  }

  return `import {\n` +
         `  useState,\n` +
         `  useEffect,\n` +
         `} from "react";\n` +
         `import { useForm } from "react-hook-form";\n\n` +
         `import z from "zod";\n` +
         `import { zodResolver } from "@hookform/resolvers/zod";\n\n` +
         `import { CustomCard } from "@/components/layout/Form";\n` +
         `import DynamicForm, { ButtonConfig, DynamicField } from "@/components/layout/Form/dynamic-form-builder";\n` +
         `import BoxContainer from "@/components/ui/box-container";\n\n` +
         `import { dropdownService } from "@/_service/um/dropdown.service";\n` +
         `${directImports}` +
         `${reportImports}\n` +
         `import { useAlert } from "@/_providers/alert-provider";\n` +
         `import { DropdownModel } from "@/_models/form.model";\n` +
         `import {\n` +
         `  ${pascalReportName}Schema,\n` +
         `  default${pascalReportName}Values,\n` +
         `} from "./schemas/${reportFileName}Schema";\n\n` +
         `function ${camelReportName}() {\n` +
         `  const header = "รายงานข้อมูล ${pascalName}";\n\n` +
         `  ${dropdownState}\n` +
         `  const { errorAlert, warningToast } = useAlert();\n` +
         `  ${stateDeclarations}\n\n` +
         `  ${dropdownFetch}\n\n` +
         `  const dynamicForm: DynamicField[] = [\n` +
         `${dynamicFieldsStr}\n` +
         `  ]\n\n` +
         `  const searchForm = useForm<z.infer<typeof ${pascalReportName}Schema>>({\n` +
         `    resolver: zodResolver(${pascalReportName}Schema),\n` +
         `    defaultValues: default${pascalReportName}Values,\n` +
         `    mode: "onChange",\n` +
         `  })\n\n` +
         `  const onClear = () => {\n` +
         `    searchForm.reset(default${pascalReportName}Values);\n` +
         `  };\n\n` +
         `  const formButtons: ButtonConfig[] = [\n` +
         `${buttonsGroup}\n` +
         `  ];\n\n` +
         `${submitAction}` +
         `${closeAction}\n\n` +
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
         `              onSubmit={${formSubmitHandlerName}}\n` +
         `              columnsNo="2"\n` +
         `              buttonColumnsNo="2"\n` +
         `            />\n` +
         `          </BoxContainer>\n` +
         `        </CustomCard>\n` +
         `      </div>\n` +
      `      ${reportModalComponent}\n` +
         `    </div>\n` +
         `  )\n` +
         `}\n\n` +
         `export default ${camelReportName};\n`;
}

// Generate separate search schema file
export function generateFrontendSearchSchema(
  moduleName: string,
  fields: FieldDefinition[]
): string {
  const pascalName = toPascalCase(moduleName);

  const zodFields = fields.map(f => {
    if (f.type === 'String') {
      return `  ${f.name}: ZodHelper.getStringField()`;
    } else if (f.type === 'Boolean') {
      return `  ${f.name}: ZodHelper.getStringBooleanCheckboxField()`;
    } else if (f.type === 'LocalDate') {
      return `  ${f.name}: ZodHelper.getPreprocessedDateField()`;
    } else {
      return `  ${f.name}: ZodHelper.toNumber()`;
    }
  }).join(',\n');

  const defaults = fields.map(f => {
    if (f.type === 'Boolean') return `  ${f.name}: "N"`;
    if (f.type === 'LocalDate') return `  ${f.name}: undefined`;
    return `  ${f.name}: ""`;
  }).join(',\n');

  return `import { ZodHelper } from "@/_helpers/zod-helper";\n` +
    `import { z } from "zod";\n\n` +
    `export const ${pascalName}SearchSchema = z.object({\n` +
    `${zodFields}\n` +
    `});\n\n` +
    `export const default${pascalName}SearchValues = {\n` +
    `${defaults}\n` +
    `};\n`;
}

// Generate separate search table MRT column configs
export function generateFrontendSearchTable(
  moduleName: string,
  moduleType: string,
  fields: FieldDefinition[]
): string {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  const typeLower = moduleType.toLowerCase();

  const columnsDef = fields.map(f => {
    const label = f.label && f.label.trim() !== '' ? f.label.trim() : toPascalCase(f.name).replace(/([a-z])([A-Z])/g, '$1 $2');
    if (f.type === 'LocalDate') {
      return `          constructDateColumn({\n` +
             `            accessorKey: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n` +
             `            header: "${label}",\n` +
             `          })`;
    } else {
      return `          {\n` +
             `            accessorKey: ${pascalName}ModelFields.${toSnakeCase(f.name)},\n` +
             `            header: "${label}",\n` +
             `          }`;
    }
  }).join(',\n');

  return `"use client";\n\n` +
    `import { ${pascalName}Model, ${pascalName}ModelFields } from "@/_models/${typeLower}/${camelName}.model";\n` +
    `import { constructDateColumn } from "@/components/layout/Form";\n` +
    `import { CustomColTool } from "@/components/layout/Table";\n` +
    `import { MRT_ColumnDef } from "material-react-table";\n` +
    `import { useMemo } from "react";\n\n` +
    `export const ${pascalName}TableColumns = {\n` +
    `  GetColumns: (\n` +
    `    editAction: (data: ${pascalName}Model) => void,\n` +
    `    deleteAction: (data: ${pascalName}Model) => void\n` +
    `  ) => {\n` +
    `    return useMemo<MRT_ColumnDef<${pascalName}Model>[]>((\n` +
    `      () =>\n` +
    `        [\n` +
    `          {\n` +
    `            accessorKey: "id",\n` +
    `            header: "No.",\n` +
    `            Cell: ({ row }) => <div>{row.index + 1}</div>,\n` +
    `            muiTableBodyCellProps: { align: "center" },\n` +
    `            size: 100,\n` +
    `          },\n` +
    `          {\n` +
    `            accessorKey: "tool",\n` +
    `            header: "Action",\n` +
    `            Cell: ({ row }) => {\n` +
    `              const active = row.original.status === "A";\n` +
    `              return (\n` +
    `                <div className="flex justify-center gap-1">\n` +
    `                  <CustomColTool\n` +
    `                    goToEditPage={() => editAction(row.original)}\n` +
    `                    goToDeletePage={() => deleteAction(row.original)}\n` +
    `                    isEdit={active}\n` +
    `                    isDelete={active}\n` +
    `                  />\n` +
    `                </div>\n` +
    `              );\n` +
    `            },\n` +
    `            size: 150,\n` +
    `            muiTableBodyCellProps: { align: "center" },\n` +
    `          },\n` +
    `${columnsDef}\n` +
    `        ] as MRT_ColumnDef<${pascalName}Model>[],\n` +
    `      [editAction, deleteAction]\n` +
    `    );\n` +
    `  },\n` +
    `};\n`;
}

// Generate separate report schema file
export function generateFrontendReportSchema(
  moduleName: string,
  fields: FieldDefinition[],
  reportFileName: string
): string {
  const finalReportName = reportFileName || (toCamelCase(moduleName) + 'Report');
  const pascalReportName = toPascalCase(finalReportName);

  const zodFields = fields.map(f => {
    if (f.type === 'String') {
      return `  ${f.name}: ZodHelper.getStringField()`;
    } else if (f.type === 'Boolean') {
      return `  ${f.name}: ZodHelper.getStringBooleanCheckboxField()`;
    } else if (f.type === 'LocalDate') {
      return `  ${f.name}: ZodHelper.getPreprocessedDateField()`;
    } else {
      return `  ${f.name}: ZodHelper.toNumber()`;
    }
  }).join(',\n');

  const defaults = fields.map(f => {
    if (f.type === 'Boolean') return `  ${f.name}: "N"`;
    if (f.type === 'LocalDate') return `  ${f.name}: undefined`;
    return `  ${f.name}: ""`;
  }).join(',\n');

  return `import { ZodHelper } from "@/_helpers/zod-helper";\n` +
    `import { z } from "zod";\n\n` +
    `export const ${pascalReportName}Schema = z.object({\n` +
    `${zodFields}\n` +
    `});\n\n` +
    `export const default${pascalReportName}Values = {\n` +
    `${defaults}\n` +
    `};\n`;
}

// Generate separate form schema file
export function generateFrontendFormSchema(
  moduleName: string,
  fields: FieldDefinition[]
): string {
  const pascalName = toPascalCase(moduleName);

  const zodFields = fields.map(f => {
    if (f.type === 'String') {
      return `  ${f.name}: ZodHelper.getStringField(true, 1)`;
    } else if (f.type === 'Boolean') {
      return `  ${f.name}: ZodHelper.getStringBooleanCheckboxField()`;
    } else if (f.type === 'LocalDate') {
      return `  ${f.name}: ZodHelper.getPreprocessedDateField(true)`;
    } else {
      return `  ${f.name}: ZodHelper.toNumber(true)`;
    }
  }).join(',\n');

  const defaults = fields.map(f => {
    if (f.type === 'Boolean') return `  ${f.name}: "N"`;
    if (f.type === 'LocalDate') return `  ${f.name}: undefined`;
    return `  ${f.name}: ""`;
  }).join(',\n');

  return `import { ZodHelper } from "@/_helpers/zod-helper";\n` +
    `import { z } from "zod";\n\n` +
    `export const ${pascalName}FormSchema = z.object({\n` +
    `${zodFields}\n` +
    `});\n\n` +
    `export const default${pascalName}FormValues = {\n` +
    `${defaults}\n` +
    `};\n`;
}
