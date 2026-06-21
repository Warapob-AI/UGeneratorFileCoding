import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  generateBackendController,
  generateBackendModel,
  generateBackendDTOs,
  generateBackendRepository,
  generateBackendRepositoryCustom,
  generateBackendRepositoryCustomImpl,
  generateBackendService,
  generateBackendServiceImpl,
  generateFrontendModel,
  generateFrontendService,
  generateFrontendComponent,
  generateFrontendSearchComponent,
  generateFrontendDetailComponent,
  generateFrontendReportComponent,
  generateFrontendSearchSchema,
  generateFrontendSearchTable,
  generateFrontendReportSchema,
  generateFrontendFormSchema,
  FieldDefinition,
  ButtonsSelection
} from '@/lib/generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      moduleName, 
      moduleType, 
      tableName, 
      className, 
      reportFileName,
      fields, 
      selectedFiles,
      buttons,
      frontendMode,
      reportEngine,
      pageHeader
    } = body as {
      moduleName: string;
      moduleType: string;
      tableName: string;
      className: string;
      reportFileName: string;
      fields: FieldDefinition[];
      selectedFiles: {
        controller: boolean;
        model: boolean;
        dto: boolean;
        repository: boolean;
        service: boolean;
        frontendModel: boolean;
        frontendService: boolean;
        frontendComponent: boolean;
      };
      buttons: ButtonsSelection;
      frontendMode: 'search' | 'report';
      reportEngine: 'direct' | 'crystal' | 'jasper';
      pageHeader?: string;
    };

    if (!moduleName || !moduleType || !fields || fields.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const pascalName = toPascalCase(moduleName);
    const camelName = toCamelCase(moduleName);
    const finalClassName = className || `Mk${pascalName}`;

    // Resolve paths relative to next.js root (which is workspace/generator)
    const baseDir = path.resolve(process.cwd(), '..', 'New folder');
    const backendBase = path.join(baseDir, 'Backend');
    const frontendBase = path.join(baseDir, 'FrontEnd');

    // Create file generation map
    const dtos = generateBackendDTOs(moduleName, moduleType, fields);
    
    const allFiles: { path: string; content: string; key: string }[] = [];

    // Controller
    if (selectedFiles.controller) {
      allFiles.push({
        key: 'controller',
        path: path.join(backendBase, 'controller', `${pascalName}Controller.java`),
        content: generateBackendController(moduleName, moduleType, finalClassName, fields)
      });
    }

    // Model
    if (selectedFiles.model) {
      allFiles.push({
        key: 'model',
        path: path.join(backendBase, 'model', `${finalClassName}.java`),
        content: generateBackendModel(moduleName, moduleType, tableName, finalClassName, fields)
      });
    }

    // DTOs
    if (selectedFiles.dto) {
      allFiles.push(
        {
          key: 'dtoCreate',
          path: path.join(backendBase, 'dto', `${pascalName}CreateRequest.java`),
          content: dtos.createRequest
        },
        {
          key: 'dtoUpdate',
          path: path.join(backendBase, 'dto', `${pascalName}UpdateRequest.java`),
          content: dtos.updateRequest
        },
        {
          key: 'dtoResponse',
          path: path.join(backendBase, 'dto', `${pascalName}Response.java`),
          content: dtos.response
        },
        {
          key: 'dtoSearch',
          path: path.join(backendBase, 'dto', `${pascalName}SearchRequest.java`),
          content: dtos.searchRequest
        }
      );
    }

    // Repository, Custom, CustomImpl
    if (selectedFiles.repository) {
      allFiles.push(
        {
          key: 'repository',
          path: path.join(backendBase, 'repository', `${pascalName}Repository.java`),
          content: generateBackendRepository(moduleName, moduleType, finalClassName, fields)
        },
        {
          key: 'repositoryCustom',
          path: path.join(backendBase, 'repository', `${pascalName}RepositoryCustom.java`),
          content: generateBackendRepositoryCustom(moduleName, moduleType, finalClassName, fields)
        },
        {
          key: 'repositoryCustomImpl',
          path: path.join(backendBase, 'repository', `${pascalName}RepositoryCustomImpl.java`),
          content: generateBackendRepositoryCustomImpl(moduleName, moduleType, tableName, finalClassName, fields)
        }
      );
    }

    // Service & ServiceImpl
    if (selectedFiles.service) {
      allFiles.push(
        {
          key: 'service',
          path: path.join(backendBase, 'service', `${pascalName}Service.java`),
          content: generateBackendService(moduleName, moduleType, finalClassName, fields)
        },
        {
          key: 'serviceImpl',
          path: path.join(backendBase, 'service', `${pascalName}ServiceImpl.java`),
          content: generateBackendServiceImpl(moduleName, moduleType, finalClassName, fields)
        }
      );
    }

    // Frontend Model
    if (selectedFiles.frontendModel) {
      allFiles.push({
        key: 'frontendModel',
        path: path.join(frontendBase, '_models', moduleType.toLowerCase(), `${camelName}.model.ts`),
        content: generateFrontendModel(moduleName, moduleType, fields, frontendMode)
      });
    }

    // Frontend Service
    if (selectedFiles.frontendService) {
      allFiles.push({
        key: 'frontendService',
        path: path.join(frontendBase, '_service', moduleType.toLowerCase(), `${camelName}.service.ts`),
        content: generateFrontendService(moduleName, moduleType, fields)
      });
    }

    // Frontend Component Page TSX
    if (selectedFiles.frontendComponent) {
      if (frontendMode === 'search') {
        // 1. Search Page (Main)
        allFiles.push({
          key: 'frontendSearchComponent',
          path: path.join(frontendBase, 'components', 'hpls', moduleType.toLowerCase(), camelName, `${camelName}.tsx`),
          content: generateFrontendSearchComponent(moduleName, moduleType, fields, buttons, pageHeader)
        });
        // 2. Search Table
        allFiles.push({
          key: 'frontendSearchTable',
          path: path.join(frontendBase, 'components', 'hpls', moduleType.toLowerCase(), camelName, 'tables', `${camelName}Table.tsx`),
          content: generateFrontendSearchTable(moduleName, moduleType, fields)
        });
        // 3. Search Schema
        allFiles.push({
          key: 'frontendSearchSchema',
          path: path.join(frontendBase, 'components', 'hpls', moduleType.toLowerCase(), camelName, 'schemas', `${camelName}SearchSchema.tsx`),
          content: generateFrontendSearchSchema(moduleName, fields)
        });
        // 4. Form Schema
        allFiles.push({
          key: 'frontendFormSchema',
          path: path.join(frontendBase, 'components', 'hpls', moduleType.toLowerCase(), camelName, 'schemas', `${camelName}FormSchema.tsx`),
          content: generateFrontendFormSchema(moduleName, fields)
        });
        // 5. Detail Dialog component (Modal)
        allFiles.push({
          key: 'frontendDetailComponent',
          path: path.join(frontendBase, 'components', 'hpls', moduleType.toLowerCase(), camelName, 'pop-ups', `${camelName}-form-modal.tsx`),
          content: generateFrontendDetailComponent(moduleName, moduleType, fields, buttons)
        });
      } else if (frontendMode === 'report') {
        const reportNameCamel = toCamelCase(reportFileName || moduleName);
        // 1. Report Page
        allFiles.push({
          key: 'frontendReportComponent',
          path: path.join(frontendBase, 'components', 'hpls', moduleType.toLowerCase(), camelName, `${reportNameCamel}.tsx`),
          content: generateFrontendReportComponent(moduleName, moduleType, fields, buttons, reportFileName, reportEngine, pageHeader)
        });
        // 2. Report Schema
        allFiles.push({
          key: 'frontendReportSchema',
          path: path.join(frontendBase, 'components', 'hpls', moduleType.toLowerCase(), camelName, 'schemas', `${reportFileName}Schema.tsx`),
          content: generateFrontendReportSchema(moduleName, fields, reportFileName)
        });
      }
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'No files selected to generate' }, { status: 400 });
    }

    // Write all selected files
    for (const file of allFiles) {
      const dir = path.dirname(file.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(file.path, file.content, 'utf8');
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${allFiles.length} selected files for ${pascalName}.`,
      files: allFiles.map(f => path.relative(baseDir, f.path))
    });
  } catch (error: any) {
    console.error('Error generating files:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
