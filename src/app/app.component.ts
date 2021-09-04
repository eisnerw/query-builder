import { Component } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { QueryBuilderConfig, RuleSet } from "angular2-query-builder";

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  name = 'Angular';

  public queryCtrl: FormControl;

  public query: RuleSet = {
    condition: 'and',
    rules: [
      { field: 'age', operator: '>=', entity: 'physical', value: 18 },
      { field: 'birthday', operator: '=', value: '2018-11-20', entity: 'nonphysical' },
      {
        condition: 'or',
        rules: [
          { field: 'gender', operator: '=', entity: 'physical', value: 'm' },
          { field: 'school', operator: 'is null', entity: 'nonphysical' },
          { field: 'notes', operator: '=', entity: 'nonphysical', value: 'Hi' }
        ]
      }
    ]
  };

  public oDataFilter: string = "hello";

  public config: QueryBuilderConfig = {
    fields: {
      age: { name: 'Age', type: 'number' },
      gender: {
        name: 'Gender',
        type: 'category',
        options: [
          { name: 'Male', value: 'm' },
          { name: 'Female', value: 'f' }
        ]
      },
      name: { name: 'Name', type: 'string' },
      notes: { name: 'Notes', type: 'string', operators: ['=', '!='] },
      educated: { name: 'College Degree?', type: 'boolean' },
      birthday: {
        name: 'Birthday', type: 'date', operators: ['=', '<=', '>'],
        defaultValue: (() => new Date())
      },
      school: { name: 'School', type: 'string', nullable: true },
      occupation: {
        name: 'Occupation',
        type: 'category',
        options: [
          { name: 'Student', value: 'student' },
          { name: 'Teacher', value: 'teacher' },
          { name: 'Unemployed', value: 'unemployed' },
          { name: 'Scientist', value: 'scientist' }
        ]
      }
    }
  };

  private BASE_URL = 'https://odatasampleservices.azurewebsites.net/V4/Northwind/Northwind.svc/';

  constructor(private formBuilder: FormBuilder) {
    this.queryCtrl = this.formBuilder.control(this.query);

    this.queryCtrl.valueChanges.subscribe(ruleSet => {
      this.oDataFilter = `${this.BASE_URL}?$filter=${this.toODataString(ruleSet)}`;
    });

  }

  private toODataString(ruleSet: RuleSet): string {
    return this.toOdataFilter(ruleSet, true);
  }

  toOdataFilter(filter: any, useOdataFour: boolean): any {
    //console.log('filter',filter);

    if (filter == null) return 'null';

    var result = [],
      condition = filter.condition || 'and',
      idx,
      length,
      field,
      type,
      format,
      operator,
      value,
      ignoreCase,
      rules = filter.rules;

    //console.log('condition',condition);
    for (idx = 0, length = rules.length; idx < length; idx++) {
      filter = rules[idx];
      field = filter.field;
      value = filter.value;
      operator = filter.operator;
      if (filter.rules) {
        filter = this.toOdataFilter(filter, useOdataFour);
      } else {
        ignoreCase = filter.ignoreCase;
        field = field.replace(/\./g, '/');
        filter = this.odataFilters[operator];
        if (useOdataFour) {
          filter = this.odataFiltersVersionFour[operator];
        }
        //console.log('f', filter);
        //console.log('o', operator);
        if (operator === 'isnull' || operator === 'is null' ||operator === 'isnotnull') {
          filter = `${field} ${filter} null`;
          //filter = `${this.BASE_URL}&$count=true`;
        } else if (operator === 'isempty' || operator === 'isnotempty') {
          filter = `${field} ${filter} ''`;
        } else if (filter && value !== undefined) {
          type = typeof value;
          if (type === 'string') {
            format = "'{1}'";
            value = value.replace(/'/g, "''");
            if (ignoreCase === true) {
              field = 'tolower(' + field + ')';
            }
          } else if (type === 'date') {
            console.log('date');
            //if (useOdataFour) {
            //  format = '{1:yyyy-MM-ddTHH:mm:ss+00:00}';
            //  value = k.timezone.apply(value, 'Etc/UTC');
            //} else {
            format = "datetime'{1:yyyy-MM-ddTHH:mm:ss}'";
            //}
          } else {
            format = '{1}';
          }
          if (filter.length > 3) {
            if (filter !== 'substringof') {
              format = '{0}({2},' + format + ')';
            } else {
              format = '{0}(' + format + ',{2})';
              if (operator === 'doesnotcontain') {
                if (useOdataFour) {
                  format = "{0}({2},'{1}') eq -1";
                  filter = 'indexof';
                } else {
                  format += ' eq false';
                }
              }
            }
          } else {
            format = '{2} {0} ' + format;
          }
          //todo fix
          filter = this.StringFormat(format, filter, value, field);
          //console.log('format', format);
          //console.log('filter', filter);
          //console.log('value', value);
          //console.log('field', field);
        }
      }
      result.push(filter);
    }
    filter = result.join(' ' + condition + ' ');
    if (result.length > 1) {
      filter = '(' + filter + ')';
    }
    return filter;
  }


    private odataFilters = {
    eq: 'eq',
    neq: 'ne',
    gt: 'gt',
    gte: 'ge',
    lt: 'lt',
    lte: 'le',
    contains: 'substringof',
    doesnotcontain: 'substringof',
    endswith: 'endswith',
    startswith: 'startswith',
    isnull: 'eq',
    isnotnull: 'ne',
    isempty: 'eq',
    isnotempty: 'ne',
  };

  private odataFiltersVersionFour = {
    eq: 'eq',
    '=': 'eq',

    neq: 'ne',
    '!=': 'ne',

    gt: 'gt',
    '>': 'gt',

    gte: 'ge',
    '>=': 'ge',

    lt: 'lt',
    '<': 'lt',

    lte: 'le',
    '<=': 'le',

    like: 'contains',

    doesnotcontain: 'substringof',
    endswith: 'endswith',
    startswith: 'startswith',
    isnull: 'eq',
    'is null': 'eq',
    isnotnull: 'ne',
    isempty: 'eq',
    isnotempty: 'ne',
    contains: 'contains',
  };
  StringFormat = function (arg1, arg2, arg3, arg4) {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];

    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }

    return theString;
  }
}