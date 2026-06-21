'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import Swal from 'sweetalert2';
import {
  toPascalCase,
  toCamelCase,
  toSnakeCase,
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
  ButtonsSelection,
  getDefaultLabel
} from '@/lib/generator';

export default function GeneratorPage() {
  // Input states
  const [moduleName, setModuleName] = useState('');
  const [moduleType, setModuleType] = useState('');
  const [tableName, setTableName] = useState('');
  const [className, setClassName] = useState('');
  const [reportFileName, setReportFileName] = useState('');
  const [frontendMode, setFrontendMode] = useState<'search' | 'report'>('search');
  const [reportEngine, setReportEngine] = useState<'direct' | 'crystal' | 'jasper'>('direct');
  const [pageHeader, setPageHeader] = useState('');

  // Form buttons selection state
  const [buttons, setButtons] = useState<ButtonsSelection>({
    search: false,
    clear: false,
    save: false,
    close: false,
    add: false,
    print: false,
    printPdf: false,
    printExcel: false
  });
  
  // Fields state
  const [fields, setFields] = useState<FieldDefinition[]>([]);

  // Tab selections
  const [activeTab, setActiveTab] = useState<'backend' | 'frontend'>('backend');
  const [activeSubTab, setActiveSubTab] = useState<string>('controller');

  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync table name and primary key field name when moduleName changes
  const handleModuleNameChange = (val: string) => {
    setModuleName(val);
    const cleaned = val.trim();
    if (cleaned) {
      const typePrefix = moduleType.toUpperCase();
      setTableName(`${typePrefix}_${toSnakeCase(cleaned)}`);
      setClassName(`Mk${toPascalCase(cleaned)}`);
      setReportFileName(toCamelCase(cleaned));

      // Sync pageHeader if empty or matches previous default template
      const pascal = toPascalCase(cleaned);
      const oldPascal = toPascalCase(moduleName);
      const defaultSearch = `หน้าจอสอบถามข้อมูล ${oldPascal}`;
      const defaultReport = `รายงานข้อมูล ${oldPascal}`;
      const isDefaultHeader = !pageHeader || pageHeader === defaultSearch || pageHeader === defaultReport;
      if (isDefaultHeader) {
        setPageHeader(frontendMode === 'report' ? `รายงานข้อมูล ${pascal}` : `หน้าจอสอบถามข้อมูล ${pascal}`);
      }

      setFields(prev => {
        const next = [...prev];
        if (next.length > 0 && next[0].isKey) {
          next[0] = {
            ...next[0],
            name: toCamelCase(cleaned),
            columnName: toSnakeCase(cleaned)
          };
        }
        return next;
      });
    }
  };

  // Sync table name prefix when moduleType changes
  const handleModuleTypeChange = (val: string) => {
    setModuleType(val);
    if (moduleName.trim()) {
      setTableName(`${val.toUpperCase()}_${toSnakeCase(moduleName.trim())}`);
    }
  };

  // Field change handlers
  const handleFieldChange = (index: number, key: keyof FieldDefinition, value: any) => {
    setFields(prev => {
      const next = [...prev];
      const oldField = prev[index];
      next[index] = { ...next[index], [key]: value };
      
      if (key === 'name') {
        next[index].columnName = toSnakeCase(value);
        
        // Auto-default label if it is currently empty or matches the old name's default
        const oldDefault = oldField.name ? getDefaultLabel(oldField.name) : '';
        const currentLabel = oldField.label || '';
        if (currentLabel === '' || currentLabel === oldDefault) {
          next[index].label = value ? getDefaultLabel(value) : '';
        }
      }

      if (key === 'frontendType') {
        // Auto-default backend type based on frontendType selection
        if (value === 'text') next[index].type = 'String';
        else if (value === 'number') next[index].type = 'Integer';
        else if (value === 'calendar') next[index].type = 'LocalDate';
        else if (value === 'checkbox') next[index].type = 'Boolean';
        else if (value === 'select') next[index].type = 'String';
        else if (value === 'radio') next[index].type = 'String';
      }
      return next;
    });
  };

  const addField = () => {
    setFields(prev => {
      const isFirst = prev.length === 0;
      const defaultName = isFirst ? toCamelCase(moduleName) : 'newField';
      const defaultLabel = defaultName ? getDefaultLabel(defaultName) : '';
      return [
        ...prev,
        { 
          name: defaultName, 
          type: 'String', 
          frontendType: 'text',
          columnName: isFirst ? toSnakeCase(moduleName) : 'NEW_FIELD', 
          isKey: isFirst,
          label: defaultLabel,
          isRequired: false,
          maxLength: undefined
        }
      ];
    });
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  // Live generation logic
  const getPreviewCode = () => {
    const name = moduleName || 'Example';
    const type = moduleType || 'mk';
    const tbl = tableName || 'MK_EXAMPLE';
    const cls = className || `Mk${toPascalCase(name)}`;
    const camelName = toCamelCase(name);
    const finalHeader = pageHeader || (frontendMode === 'report' ? `รายงานข้อมูล ${toPascalCase(name)}` : `หน้าจอสอบถามข้อมูล ${toPascalCase(name)}`);

    if (activeTab === 'backend') {
      const dtos = generateBackendDTOs(name, type, fields);
      switch (activeSubTab) {
        case 'controller':
          return {
            path: `Backend/controller/${toPascalCase(name)}Controller.java`,
            code: generateBackendController(name, type, cls, fields)
          };
        case 'model':
          return {
            path: `Backend/model/${cls}.java`,
            code: generateBackendModel(name, type, tbl, cls, fields)
          };
        case 'dtoCreate':
          return {
            path: `Backend/dto/${toPascalCase(name)}CreateRequest.java`,
            code: dtos.createRequest
          };
        case 'dtoUpdate':
          return {
            path: `Backend/dto/${toPascalCase(name)}UpdateRequest.java`,
            code: dtos.updateRequest
          };
        case 'dtoResponse':
          return {
            path: `Backend/dto/${toPascalCase(name)}Response.java`,
            code: dtos.response
          };
        case 'dtoSearch':
          return {
            path: `Backend/dto/${toPascalCase(name)}SearchRequest.java`,
            code: dtos.searchRequest
          };
        case 'repository':
          return {
            path: `Backend/repository/${toPascalCase(name)}Repository.java`,
            code: generateBackendRepository(name, type, cls, fields)
          };
        case 'repositoryCustom':
          return {
            path: `Backend/repository/${toPascalCase(name)}RepositoryCustom.java`,
            code: generateBackendRepositoryCustom(name, type, cls, fields)
          };
        case 'repositoryCustomImpl':
          return {
            path: `Backend/repository/${toPascalCase(name)}RepositoryCustomImpl.java`,
            code: generateBackendRepositoryCustomImpl(name, type, tbl, cls, fields)
          };
        case 'service':
          return {
            path: `Backend/service/${toPascalCase(name)}Service.java`,
            code: generateBackendService(name, type, cls, fields)
          };
        case 'serviceImpl':
          return {
            path: `Backend/service/${toPascalCase(name)}ServiceImpl.java`,
            code: generateBackendServiceImpl(name, type, cls, fields)
          };
        default:
          return { path: '', code: '' };
      }
    } else {
      const reportNameCamel = toCamelCase(reportFileName || name);
      switch (activeSubTab) {
        case 'service':
          return {
            path: `FrontEnd/_service/${type.toLowerCase()}/${camelName}.service.ts`,
            code: generateFrontendService(name, type, fields)
          };
        case 'model':
          return {
            path: `FrontEnd/_models/${type.toLowerCase()}/${camelName}.model.ts`,
            code: generateFrontendModel(name, type, fields, frontendMode)
          };
        case 'searchViewPage':
          return {
            path: `FrontEnd/components/hpls/${type.toLowerCase()}/${camelName}/${camelName}.tsx`,
            code: generateFrontendSearchComponent(name, type, fields, buttons, finalHeader)
          };
        case 'searchTable':
          return {
            path: `FrontEnd/components/hpls/${type.toLowerCase()}/${camelName}/tables/${camelName}Table.tsx`,
            code: generateFrontendSearchTable(name, type, fields)
          };
        case 'searchSchema':
          return {
            path: `FrontEnd/components/hpls/${type.toLowerCase()}/${camelName}/schemas/${camelName}SearchSchema.tsx`,
            code: generateFrontendSearchSchema(name, fields)
          };
        case 'formSchema':
          return {
            path: `FrontEnd/components/hpls/${type.toLowerCase()}/${camelName}/schemas/${camelName}FormSchema.tsx`,
            code: generateFrontendFormSchema(name, fields)
          };
        case 'detailComponent':
          return {
            path: `FrontEnd/components/hpls/${type.toLowerCase()}/${camelName}/pop-ups/${camelName}-form-modal.tsx`,
            code: generateFrontendDetailComponent(name, type, fields, buttons)
          };
        case 'reportComponent':
          return {
            path: `FrontEnd/components/hpls/${type.toLowerCase()}/${camelName}/${reportNameCamel}.tsx`,
            code: generateFrontendReportComponent(name, type, fields, buttons, reportFileName, reportEngine, finalHeader)
          };
        case 'reportSchema':
          return {
            path: `FrontEnd/components/hpls/${type.toLowerCase()}/${camelName}/schemas/${reportFileName}Schema.tsx`,
            code: generateFrontendReportSchema(name, fields, reportFileName)
          };
        default:
          return { path: '', code: '' };
      }
    }
  };

  const { path: currentPath, code: currentCode } = getPreviewCode();

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    showToast('Copied to clipboard!', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Write files to local disk
  const handleGenerate = async () => {
    if (fields.length === 0) {
      showToast('Please add at least one field to generate.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const selectedFiles = {
        controller: true,
        model: true,
        dto: true,
        repository: true,
        service: true,
        frontendModel: true,
        frontendService: true,
        frontendComponent: true
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName,
          moduleType,
          tableName,
          className,
          reportFileName,
          selectedFiles,
          buttons,
          fields,
          frontendMode,
          reportEngine,
          pageHeader
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.error || 'Failed to generate files', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error occurred', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className={styles.container}>
      {/* Toast Alert */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <div className={styles.toastText}>{toast.message}</div>
        </div>
      )}

      {/* Left Sidebar (Configuration & Lists) */}
      <section className={styles.sidebar}>
        <div className={styles.titleSection}>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 16 4-4-4-4"/>
              <path d="m6 8-4 4 4 4"/>
              <path d="m14.5 4-5 16"/>
            </svg>
            Boilerplate Generator
          </h1>
          <p>Local workbench for Gable stack generation</p>
        </div>

        {/* Configurations */}
        <div>
          <div className={styles.sectionTitle}>Configurations</div>
          
          <div className={styles.formGroup}>
            <label htmlFor="inputModuleName">Module Name (PascalCase)</label>
            <input
              id="inputModuleName"
              type="text"
              value={moduleName}
              onChange={(e) => handleModuleNameChange(e.target.value)}
              placeholder="e.g. DownType, Campaign"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="selectModuleType">Module / Folder Type</label>
            <select
              id="selectModuleType"
              value={moduleType}
              onChange={(e) => handleModuleTypeChange(e.target.value)}
            >
              <option value="ap">ap</option>
              <option value="as">as</option>
              <option value="bp">bp</option>
              <option value="cc">cc</option>
              <option value="ci">ci</option>
              <option value="cl">cl</option>
              <option value="cm">cm</option>
              <option value="co">co</option>
              <option value="cr">cr</option>
              <option value="ct">ct</option>
              <option value="lt">lt</option>
              <option value="mk">mk</option>
              <option value="pf">pf</option>
              <option value="ps">ps</option>
              <option value="report">report</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="selectFrontendMode">Generation Mode</label>
            <select
              id="selectFrontendMode"
              value={frontendMode}
              onChange={(e) => {
                const modeVal = e.target.value as 'search' | 'report';
                setFrontendMode(modeVal);

                // Sync pageHeader on mode change
                const pascal = toPascalCase(moduleName);
                const defaultSearch = `หน้าจอสอบถามข้อมูล ${pascal}`;
                const defaultReport = `รายงานข้อมูล ${pascal}`;
                const isDefaultHeader = !pageHeader || pageHeader === defaultSearch || pageHeader === defaultReport;
                if (isDefaultHeader) {
                  setPageHeader(modeVal === 'report' ? `รายงานข้อมูล ${pascal || 'Example'}` : `หน้าจอสอบถามข้อมูล ${pascal || 'Example'}`);
                }

                if (modeVal === 'report') {
                  setButtons(prev => ({
                    ...prev,
                    search: false,
                    clear: true,
                    save: false,
                    close: true,
                    add: false,
                    print: true,
                    printPdf: false,
                    printExcel: false
                  }));
                  setActiveSubTab('reportComponent');
                } else {
                  setButtons(prev => ({
                    ...prev,
                    search: true,
                    clear: true,
                    save: true,
                    close: true,
                    add: true,
                    print: false,
                    printPdf: false,
                    printExcel: false
                  }));
                  setActiveSubTab('searchViewPage');
                }
              }}
            >
              <option value="search">Search (Transaction)</option>
              <option value="report">Report</option>
            </select>
          </div>

          {frontendMode === 'report' && (
            <div className={styles.formGroup}>
              <label htmlFor="selectReportEngine">Report Engine</label>
              <select
                id="selectReportEngine"
                value={reportEngine}
                onChange={(e) => setReportEngine(e.target.value as 'direct' | 'crystal' | 'jasper')}
              >
                <option value="direct">Direct Excel Export</option>
                <option value="crystal">Crystal Report</option>
                <option value="jasper">Jasper Report</option>
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="inputPageHeader">Page Header / Title</label>
            <input
              id="inputPageHeader"
              type="text"
              value={pageHeader}
              onChange={(e) => setPageHeader(e.target.value)}
              placeholder="e.g. หน้าจอสอบถามข้อมูลประเภทผู้ลงทะเบียน"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="inputClassName">Entity Class Name</label>
            <input
              id="inputClassName"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. MkDownType"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="inputTableName">Database Table Name</label>
            <input
              id="inputTableName"
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. MK_DOWN_TYPE"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="inputReportFileName">Report File Name (camelCase)</label>
            <input
              id="inputReportFileName"
              type="text"
              value={reportFileName}
              onChange={(e) => setReportFileName(e.target.value)}
              placeholder="e.g. downTypeReport"
            />
          </div>
        </div>

        {/* Buttons Selector Checkbox Grid */}
        <div>
          <div className={styles.sectionTitle}>Form Buttons</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={buttons.search} onChange={(e) => setButtons(prev => ({ ...prev, search: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)' }} />
              Search
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={buttons.clear} onChange={(e) => setButtons(prev => ({ ...prev, clear: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)' }} />
              Clear
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={buttons.save} onChange={(e) => setButtons(prev => ({ ...prev, save: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)' }} />
              Save
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={buttons.add} onChange={(e) => setButtons(prev => ({ ...prev, add: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)' }} />
              Add
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={buttons.close} onChange={(e) => setButtons(prev => ({ ...prev, close: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)' }} />
              Close
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={buttons.print} onChange={(e) => setButtons(prev => ({ ...prev, print: e.target.checked }))} style={{ accentColor: 'var(--accent-primary)' }} />
              Print
            </label>
          </div>
        </div>

        {/* Fields Builder */}
        <div className={styles.fieldsSection}>
          <div className={styles.sectionTitle}>
            <span>Fields / Parameters</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={styles.btnAddField} onClick={addField}>+ Add Field</button>
              <button 
                className={styles.btnClearFields} 
                onClick={() => {
                  Swal.fire({
                    title: 'Confirm Clear',
                    text: 'Are you sure you want to clear all fields?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Clear All',
                    cancelButtonText: 'Cancel'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      setFields([]);
                    }
                  });
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className={styles.fieldsContainer}>
            {fields.length === 0 ? (
              <div className={styles.emptyState} style={{ padding: '20px', textAlign: 'center' }}>
                No fields added yet. Click "+ Add Field" to get started.
              </div>
            ) : (
              fields.map((field, idx) => (
                <div key={idx} className={styles.fieldRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                      placeholder="Field name"
                      title="Field Name"
                      style={{ flex: 2 }}
                    />
                    <select
                      value={field.frontendType || 'text'}
                      onChange={(e) => handleFieldChange(idx, 'frontendType', e.target.value)}
                      title="Frontend Type"
                      style={{ flex: 1.3 }}
                    >
                      <option value="text">text</option>
                      <option value="number">number</option>
                      <option value="calendar">calendar</option>
                      <option value="checkbox">checkbox</option>
                      <option value="select">select</option>
                      <option value="radio">radio</option>
                    </select>
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                      title="Backend Type"
                      style={{ flex: 1.3 }}
                    >
                      <option value="String">String</option>
                      <option value="Integer">Integer</option>
                      <option value="Long">Long</option>
                      <option value="Double">Double</option>
                      <option value="BigDecimal">BigDecimal</option>
                      <option value="LocalDate">LocalDate</option>
                      <option value="Boolean">Boolean</option>
                    </select>
                    <div style={{ width: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={field.isKey}
                        onChange={(e) => handleFieldChange(idx, 'isKey', e.target.checked)}
                        title="Is Primary Key"
                      />
                    </div>
                    <button
                      className={styles.btnDeleteField}
                      onClick={() => removeField(idx)}
                      title="Remove Field"
                      style={{ width: '28px', height: '28px' }}
                    >
                      &times;
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                    <input
                      type="text"
                      value={field.label || ''}
                      onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                      placeholder="UI Label (e.g. คำอธิบาย)"
                      title="UI Label"
                      style={{ flex: 2.5, fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={field.isRequired || false}
                        onChange={(e) => handleFieldChange(idx, 'isRequired', e.target.checked)}
                        title="Is Required"
                      />
                      Req
                    </label>
                    <input
                      type="number"
                      value={field.maxLength || ''}
                      onChange={(e) => handleFieldChange(idx, 'maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Max len"
                      title="Max Length"
                      style={{ flex: 1.2, fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Right Code Workspace (Tabs, Previews & Action button) */}
      <section className={`${styles.workspace} glass-panel`}>
        <div className={styles.workspaceHeader}>
          <div className={styles.tabControls}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'backend' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('backend');
                setActiveSubTab('controller');
              }}
            >
              Backend (Java Spring Boot)
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'frontend' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('frontend');
                setActiveSubTab('service');
              }}
            >
              Frontend (TypeScript React)
            </button>
          </div>

          <button
            className={styles.btnGenerate}
            onClick={handleGenerate}
            disabled={generating || !moduleName || fields.length === 0}
          >
            {generating ? (
              <>Generating...</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                Generate Code Files
              </>
            )}
          </button>
        </div>

        {/* Sub-tab selection */}
        {activeTab === 'backend' ? (
          <div className={styles.subTabControls}>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'controller' ? styles.active : ''}`} onClick={() => setActiveSubTab('controller')}>Controller</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'model' ? styles.active : ''}`} onClick={() => setActiveSubTab('model')}>Model Entity</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'dtoCreate' ? styles.active : ''}`} onClick={() => setActiveSubTab('dtoCreate')}>CreateRequest DTO</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'dtoUpdate' ? styles.active : ''}`} onClick={() => setActiveSubTab('dtoUpdate')}>UpdateRequest DTO</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'dtoResponse' ? styles.active : ''}`} onClick={() => setActiveSubTab('dtoResponse')}>Response DTO</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'dtoSearch' ? styles.active : ''}`} onClick={() => setActiveSubTab('dtoSearch')}>SearchRequest DTO</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'repository' ? styles.active : ''}`} onClick={() => setActiveSubTab('repository')}>Repository</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'repositoryCustom' ? styles.active : ''}`} onClick={() => setActiveSubTab('repositoryCustom')}>Repo Custom</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'repositoryCustomImpl' ? styles.active : ''}`} onClick={() => setActiveSubTab('repositoryCustomImpl')}>Repo Custom Impl</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'service' ? styles.active : ''}`} onClick={() => setActiveSubTab('service')}>Service</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'serviceImpl' ? styles.active : ''}`} onClick={() => setActiveSubTab('serviceImpl')}>Service Impl</button>
          </div>
        ) : (
          <div className={styles.subTabControls}>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'service' ? styles.active : ''}`} onClick={() => setActiveSubTab('service')}>Service File</button>
            <button className={`${styles.subTabBtn} ${activeSubTab === 'model' ? styles.active : ''}`} onClick={() => setActiveSubTab('model')}>Schema Model</button>
            {frontendMode === 'search' && (
              <>
                <button className={`${styles.subTabBtn} ${activeSubTab === 'searchViewPage' ? styles.active : ''}`} onClick={() => setActiveSubTab('searchViewPage')}>Search Page (Main)</button>
                <button className={`${styles.subTabBtn} ${activeSubTab === 'searchTable' ? styles.active : ''}`} onClick={() => setActiveSubTab('searchTable')}>Search Table</button>
                <button className={`${styles.subTabBtn} ${activeSubTab === 'searchSchema' ? styles.active : ''}`} onClick={() => setActiveSubTab('searchSchema')}>Search Schema</button>
                <button className={`${styles.subTabBtn} ${activeSubTab === 'formSchema' ? styles.active : ''}`} onClick={() => setActiveSubTab('formSchema')}>Form Schema</button>
                <button className={`${styles.subTabBtn} ${activeSubTab === 'detailComponent' ? styles.active : ''}`} onClick={() => setActiveSubTab('detailComponent')}>Detail Dialog</button>
              </>
            )}
            {frontendMode === 'report' && (
              <>
                <button className={`${styles.subTabBtn} ${activeSubTab === 'reportComponent' ? styles.active : ''}`} onClick={() => setActiveSubTab('reportComponent')}>Report Page</button>
                <button className={`${styles.subTabBtn} ${activeSubTab === 'reportSchema' ? styles.active : ''}`} onClick={() => setActiveSubTab('reportSchema')}>Report Schema</button>
              </>
            )}
          </div>
        )}

        {/* Live File Previewer */}
        <div className={styles.previewContainer}>
          <div className={styles.previewHeader}>
            <span className={styles.filePathDisplay}>{currentPath}</span>
            <button className={styles.btnCopy} onClick={handleCopy}>Copy Code</button>
          </div>
          <pre className={styles.codeArea}>
            <code>{currentCode}</code>
          </pre>
        </div>
      </section>
    </main>
  );
}
