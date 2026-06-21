import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { toKebabCase } from '@/lib/generator';

export async function GET() {
  try {
    const baseDir = path.resolve(process.cwd(), '..', 'New folder');
    const backendControllerDir = path.join(baseDir, 'Backend', 'controller');

    if (!fs.existsSync(backendControllerDir)) {
      return NextResponse.json({ success: true, modules: [] });
    }

    const files = fs.readdirSync(backendControllerDir);
    const modulesList: any[] = [];

    for (const file of files) {
      if (file.endsWith('Controller.java')) {
        const moduleName = file.replace('Controller.java', '');
        const filePath = path.join(backendControllerDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract module type from package (e.g., package com.gable.um.mk.controller -> mk)
        const packageMatch = content.match(/package\s+com\.gable\.um\.(\w+)\.controller/);
        const moduleType = packageMatch ? packageMatch[1] : 'mk';

        const kebabName = toKebabCase(moduleName);

        // Check file existence
        const backendBase = path.join(baseDir, 'Backend');
        const frontendBase = path.join(baseDir, 'FrontEnd');

        const filesStatus = {
          controller: true,
          model: fs.existsSync(path.join(backendBase, 'model', `Mk${moduleName}.java`)),
          repository: fs.existsSync(path.join(backendBase, 'repository', `${moduleName}Repository.java`)),
          service: fs.existsSync(path.join(backendBase, 'service', `${moduleName}Service.java`)),
          frontendModel: fs.existsSync(path.join(frontendBase, '_models', moduleType, `${kebabName}.model.ts`)),
          frontendService: fs.existsSync(path.join(frontendBase, '_service', moduleType, `${kebabName}.service.ts`))
        };

        modulesList.push({
          name: moduleName,
          type: moduleType,
          controllerFile: file,
          filesStatus
        });
      }
    }

    return NextResponse.json({ success: true, modules: modulesList });
  } catch (error: any) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
