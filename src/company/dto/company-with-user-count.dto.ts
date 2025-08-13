import { Company } from '../company.entity';

export class CompanyWithUserCountDto {
  id: number;
  name: string;
  logo: string;
  userCount: number;

  constructor(company: any) {
    this.id = company.company_id;
    this.name = company.company_name;
    this.logo = company.company_logo;
    this.userCount = Number(company.userCount); // Ensure userCount is a number
  }
}
