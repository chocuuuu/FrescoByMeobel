from decimal import Decimal

def compute_philhealth_contribution(basic_salary):

    basic_salary = Decimal(basic_salary)
    total_contribution = basic_salary * Decimal(.05)

    return {
        "Basic Salary": Decimal(total_contribution),
        "Total Contribution": Decimal(total_contribution),
    }
