import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Invoice, Task, Project } from '../database/entities';

@Injectable()
export class PdfService implements OnModuleDestroy {
  private browser: puppeteer.Browser | null = null;
  private assetsCache: { fonts: Record<string, string>; logo: string } | null =
    null;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  private getAssets(): { fonts: Record<string, string>; logo: string } {
    if (this.assetsCache) return this.assetsCache;
    const assetsDir = path.join(__dirname, 'assets');
    const fontFiles = [
      'HelveticaNeueLTCom-UltLt',
      'HelveticaNeueLTCom-Th',
      'HelveticaNeueLTCom-Bd',
    ];
    const fonts: Record<string, string> = {};
    for (const name of fontFiles) {
      const buf = fs.readFileSync(path.join(assetsDir, `${name}.ttf`));
      fonts[name] = buf.toString('base64');
    }
    const logoBuf = fs.readFileSync(path.join(assetsDir, 'troop_logo.jpg'));
    const logo = `data:image/jpeg;base64,${logoBuf.toString('base64')}`;
    this.assetsCache = { fonts, logo };
    return this.assetsCache;
  }

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          // Force consistent font rendering so Chromium subsets and embeds
          // every glyph it actually rasterizes for the PDF.
          '--font-render-hinting=none',
          '--disable-font-subpixel-positioning',
          '--export-tagged-pdf',
        ],
        executablePath: executablePath || undefined,
      });
    }
    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }

  async generateInvoicePdf(invoiceId: number): Promise<Buffer> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['tasks', 'tasks.project', 'tasks.project.client', 'tasks.sessions', 'client'],
    });

    if (!invoice) throw new Error('Invoice not found');

    // Group tasks by project
    const projectMap = new Map<number, { project: Project; tasks: Task[] }>();
    const usableTasks = (invoice.tasks || []).filter((t) => t.isActive);

    for (const task of usableTasks) {
      if (!projectMap.has(task.projectId)) {
        projectMap.set(task.projectId, { project: task.project, tasks: [] });
      }
      projectMap.get(task.projectId)!.tasks.push(task);
    }

    // Sort tasks by order
    for (const group of projectMap.values()) {
      group.tasks.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }

    const projects = Array.from(projectMap.values());

    // Calculate totals
    let totalCost = 0;
    let totalDuration = 0;
    const projectsData = projects.map((pg) => {
      const tasks = pg.tasks.map((task) => {
        const duration = this.getTaskDuration(task);
        const cost = this.getTaskCost(task);
        totalCost += cost;
        totalDuration += duration;
        return {
          name: this.nl2br(task.name),
          note: task.note ? this.nl2br(task.note) : null,
          date: this.formatDate(this.getTaskDate(task)),
          duration: duration.toFixed(2),
          cost: this.formatAmount(cost),
        };
      });
      return { name: pg.project?.name || 'Projekt', tasks };
    });

    const tax = invoice.reverseCharge ? 0 : totalCost * 0.2;
    const total = totalCost + tax;

    const assets = this.getAssets();
    const templateData = {
      invoice: {
        number: invoice.number,
        clientName: invoice.clientName,
        clientAddress: (invoice.clientAddress || '').replace(/\n/g, '<br>'),
        clientVatNumber: invoice.clientVatNumber,
        reverseCharge: invoice.reverseCharge,
        showHours: invoice.showHours,
        showDate: invoice.showDate,
        note: invoice.note,
        sentAt: this.formatDate(invoice.sentAt),
        dueDate: this.formatDate(invoice.getDueDate()),
      },
      projects: projectsData,
      totalCost: this.formatAmount(totalCost),
      totalDuration: totalDuration.toFixed(2),
      tax: this.formatAmount(tax),
      total: this.formatAmount(total),
      assets,
    };

    const html = await this.renderTemplate('invoice', templateData);
    return this.htmlToPdf(html, `Rechnung ${invoice.number}`);
  }

  async generateQuotePdf(
    projectId: number,
    options: { title?: string; showHours?: boolean },
  ): Promise<Buffer> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['client', 'tasks', 'tasks.sessions'],
    });

    if (!project) throw new Error('Project not found');

    const tasks = (project.tasks || [])
      .filter((t) => !t.invoiceId && t.isActive)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    let totalCost = 0;
    let totalDuration = 0;
    const tasksData = tasks.map((task) => {
      const duration = this.getTaskDuration(task);
      const cost = this.getTaskCost(task);
      totalCost += cost;
      totalDuration += duration;
      return {
        name: this.nl2br(task.name),
        note: task.note ? this.nl2br(task.note) : null,
        duration: duration.toFixed(2),
        cost: this.formatAmount(cost),
      };
    });

    const reverseCharge = project.client?.reverseCharge || false;
    const tax = reverseCharge ? 0 : totalCost * 0.2;
    const total = totalCost + tax;

    const assets = this.getAssets();
    const templateData = {
      title: options.title || `Angebot ${project.name}`,
      showHours: options.showHours !== false,
      reverseCharge,
      project: { name: project.name },
      client: {
        name: project.client?.name,
        address: (project.client?.address || '').replace(/\n/g, '<br>'),
      },
      tasks: tasksData,
      totalCost: this.formatAmount(totalCost),
      totalDuration: totalDuration.toFixed(2),
      tax: this.formatAmount(tax),
      total: this.formatAmount(total),
      date: this.formatDate(new Date().toISOString()),
      assets,
    };

    const html = await this.renderTemplate('quote', templateData);
    return this.htmlToPdf(html, options.title || `Angebot ${project.name}`);
  }

  private getTaskDuration(task: Task): number {
    if (task.fixedDuration) return Number(task.fixedDuration);
    return (task.sessions || [])
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + Number(s.duration), 0);
  }

  private getTaskCost(task: Task): number {
    if (task.fixedCost) return Number(task.fixedCost);
    const duration = this.getTaskDuration(task);
    const rate = this.getHourlyRate(task);
    return duration * rate;
  }

  private getHourlyRate(task: Task): number {
    if (task.hourlyRate) return Number(task.hourlyRate);
    if (task.project?.hourlyRate) return Number(task.project.hourlyRate);
    if (task.project?.client?.hourlyRate) return Number(task.project.client.hourlyRate);
    return 65;
  }

  private getTaskDate(task: Task): string {
    if (task.fixedDate) return task.fixedDate;
    const sessions = (task.sessions || []).sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
    if (sessions.length > 0) return sessions[0].startedAt.toString();
    return task.createdAt?.toISOString() || new Date().toISOString();
  }

  private nl2br(text: string | null): string {
    if (!text) return '';
    return text.replace(/\r?\n/g, '<br>');
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('de-AT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  private async renderTemplate(name: string, data: any): Promise<string> {
    const templateDir = path.join(__dirname, 'templates');
    const templatePath = path.join(templateDir, `${name}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');

    // If css is not already in data, add it from pdf.css
    if (data && !data.css) {
      data.css = fs.readFileSync(path.join(templateDir, 'pdf.css'), 'utf-8');
    }

    const template = Handlebars.compile(templateSource);
    let html = template(data);

    // Replace asset placeholders after Handlebars compilation to avoid
    // Handlebars parsing huge base64 strings (which could be slow or break
    // if base64 accidentally contains {{ sequences)
    if (data.assets) {
      const { fonts, logo } = data.assets;
      if (fonts) {
        for (const [fontName, b64] of Object.entries(fonts)) {
          const escaped = fontName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          html = html.replace(
            new RegExp(`__FONT_${escaped}__`, 'g'),
            b64 as string,
          );
        }
      }
      if (logo) {
        html = html.replace(/__LOGO_DATA_URI__/g, logo);
      }
    }

    return html;
  }

  private async htmlToPdf(
    html: string,
    headerTitle: string,
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // The @font-face declarations only kick in when something actually paints
    // with the font. Force every font into the active set via FontFace API
    // and wait for them to load — without this Chromium often falls back to
    // a system font and does not embed our HelveticaNeue glyphs in the PDF.
    const assets = this.getAssets();
    await page.evaluate(async (fonts: Record<string, string>) => {
      const promises = Object.entries(fonts).map(async ([name, b64]) => {
        const ff = new FontFace(name, `url(data:font/ttf;base64,${b64})`);
        const loaded = await ff.load();
        (document as any).fonts.add(loaded);
      });
      await Promise.all(promises);
      await (document as any).fonts.ready;
    }, assets.fonts);

    const headerTemplate = await this.renderTemplate('header', { title: headerTitle, assets });
    const footerTemplate = await this.renderTemplate('footer', { assets });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: '250px',
        bottom: '150px',
        left: '2.54cm',
        right: '2.54cm',
      },
    });
    await page.close();
    return Buffer.from(pdfBuffer);
  }
}
