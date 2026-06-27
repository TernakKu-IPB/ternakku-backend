import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(options: {
    to: ISendMailOptions['to'];
    subject: ISendMailOptions['subject'];
    template: ISendMailOptions['template'];
    context: ISendMailOptions['context'];
  }) {
    await this.mailerService.sendMail(options);
  }
}
