<?php

namespace Modules\Authentication\Enums;

enum Role: string
{
  case ADMIN = 'admin';
  case HR_MANAGER = 'hr_manager';
  case PROJECT_MANAGER = 'project_manager';
  case EMPLOYEE = 'employee';
    // case INTERN = 'intern';
  case ACCOUNTANT = 'accountant';
  case CUSTOMER = 'customer';

  /**
   * Get a human-readable label for the role.
   */
  public function label(): string
  {
    return match ($this) {
      self::ADMIN => 'Admin',
      self::HR_MANAGER => 'HR Manager',
      self::PROJECT_MANAGER => 'Project Manager',
      self::EMPLOYEE => 'Employee',
      // self::INTERN => 'Intern',
      self::ACCOUNTANT => 'Accountant',
      self::CUSTOMER => 'Customer',
    };
  }
}
