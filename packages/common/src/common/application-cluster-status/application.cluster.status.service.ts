import { Injectable } from "@nestjs/common";
import moment from 'moment';
import { ApplicationStatusClusterComparison, ApplicationStatusError } from "./entities/common";

@Injectable()
export class ApplicationClusterStatusService {
  private errors: ApplicationStatusError = {};
  private clusterComparisonValue: ApplicationStatusClusterComparison = {};

  constructor() { }

  setError(label: string) {
    const currentMinute = this.getCurrentMinute();
    const currentValue = {
      label,
      date: currentMinute,
    };

    if (this.errors[currentMinute]) {
      this.errors[currentMinute].push(currentValue);
    } else {
      this.errors[currentMinute] = [currentValue];
    }
  }

  setValueForClusterComparison(label: string, value: any) {
    const currentMinute = this.getCurrentMinute();
    const currentValue = {
      label,
      date: currentMinute,
      value,
    };

    if (this.clusterComparisonValue[currentMinute]) {
      this.clusterComparisonValue[currentMinute].push(currentValue);
    } else {
      this.clusterComparisonValue[currentMinute] = [currentValue];
    }
  }

  getData() {
    const dataToReturn = {
      errors: this.errors,
      values: this.clusterComparisonValue,
    };

    const prevMinute = this.getPreviousMinute();
    delete this.errors[prevMinute];
    delete this.clusterComparisonValue[prevMinute];

    return dataToReturn;
  }

  private getCurrentMinute() {
    return moment().format('YYYY-MM-DD HH:mm');
  }

  private getPreviousMinute() {
    return moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm');
  }
}
