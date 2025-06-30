/**
 * Dashboard CRM
 */

'use strict';
(async function () {
  let cardColor, labelColor, shadeColor, legendColor, borderColor;
  if (isDarkStyle) {
    cardColor = config.colors_dark.cardColor;
    labelColor = config.colors_dark.textMuted;
    legendColor = config.colors_dark.bodyColor;
    borderColor = config.colors_dark.borderColor;
    shadeColor = 'dark';
  } else {
    cardColor = config.colors.cardColor;
    labelColor = config.colors.textMuted;
    legendColor = config.colors.bodyColor;
    borderColor = config.colors.borderColor;
    shadeColor = '';
  }

  /*
  document.querySelectorAll('#canByLoc li').forEach(loc => {
    loc.addEventListener('click', (e)=> {
      console.log(loc.getAttribute('id'))
      fetch('/users/locations/cancelled', {
        method: 'GET'
      })
    })
  })*/

  fetch('/users/dashboard/lastQuarter', {
    method: 'POST'
  }).then((response)=>{
    return response.json()
  }).then(lastQuarter => {
    $("#salesLastQuarter").html(lastQuarter.lastQuarter + 'K');
    $("#porClastQuarter").html(lastQuarter.porC + '%');
    var elementPrem = document.getElementById('porClastQuarter');
    if (lastQuarter.porC < 0) {
      elementPrem.classList.add("text-danger");
    } else {
      elementPrem.classList.add("text-success");
    }
    
    // sales Last Quarter Policies Area Chart

    $("#policiesLastQuarter").html(lastQuarter.lastQuarterPolicies);
    $("#polPorClastQuarter").html(lastQuarter.porCPolicies + '%');
    var elementPol = document.getElementById('polPorClastQuarter');
    if (lastQuarter.porCPolicies < 0) {
      elementPol.classList.add("text-danger");
    } else {
      elementPol.classList.add("text-success");
    }
    // Sales last Quarter Area Chart
    // --------------------------------------------------------------------
    const salesLastYearEl = document.querySelector('#salesLastYear'),
      salesLastYearConfig = {
        chart: {
          height: 78,
          type: 'area',
          parentHeightOffset: 0,
          toolbar: {
            show: false
          },
          sparkline: {
            enabled: true
          }
        },
        markers: {
          colors: 'transparent',
          strokeColors: 'transparent'
        },
        grid: {
          show: false
        },
        colors: [config.colors.success],
        fill: {
          type: 'gradient',
          gradient: {
            shade: shadeColor,
            shadeIntensity: 0.8,
            opacityFrom: 0.6,
            opacityTo: 0.25
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: 2,
          curve: 'smooth'
        },
        series: [
          {
            data: lastQuarter.lastQuarterPremByMonth
          }
        ],
        xaxis: {
          show: true,
          lines: {
            show: false
          },
          labels: {
            show: false
          },
          stroke: {
            width: 0
          },
          axisBorder: {
            show: false
          }
        },
        yaxis: {
          stroke: {
            width: 0
          },
          show: false
        },
        tooltip: {
          enabled: false
        }
      };
    if (typeof salesLastYearEl !== undefined && salesLastYearEl !== null) {
      const salesLastYear = new ApexCharts(salesLastYearEl, salesLastYearConfig);
      salesLastYear.render();
    }

    const salesLastQuarterPoliciesEl = document.querySelector('#salesLastQuarterPolicies'),
    salesLastQuarterPoliciesConfig = {
      chart: {
        height: 78,
        type: 'area',
        parentHeightOffset: 0,
        toolbar: {
          show: false
        },
        sparkline: {
          enabled: true
        }
      },
      markers: {
        colors: 'transparent',
        strokeColors: 'transparent'
      },
      grid: {
        show: false
      },
      colors: [config.colors.success],
      fill: {
        type: 'gradient',
        gradient: {
          shade: shadeColor,
          shadeIntensity: 0.8,
          opacityFrom: 0.6,
          opacityTo: 0.25
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2,
        curve: 'smooth'
      },
      series: [
        {
          data: lastQuarter.lastQuarterPolByMonth
        }
      ],
      xaxis: {
        show: true,
        lines: {
          show: false
        },
        labels: {
          show: false
        },
        stroke: {
          width: 0
        },
        axisBorder: {
          show: false
        }
      },
      yaxis: {
        stroke: {
          width: 0
        },
        show: false
      },
      tooltip: {
        enabled: false
      }
    };
    if (typeof salesLastQuarterPolicies !== undefined && salesLastQuarterPolicies !== null) {
      const salesLastQuarterPolicies = new ApexCharts(salesLastQuarterPoliciesEl, salesLastQuarterPoliciesConfig);
      salesLastQuarterPolicies.render();
    }
  })
  
  fetch('/users/dashboard/weekReports', {
    method: 'POST'
  }).then((response)=>{
    return response.json()
  }).then(weekReports => {
      $("#productionGrowthWeekPrem").html(weekReports.weekPrem);
      $("#productionGrowthWeekPol").html(weekReports.weekPol);
      $("#lastWeekPremium").html(weekReports.lastWeekPrem + 'k');
      $("#lastWeekPolicies").html(weekReports.lastWeekPol);
      weekReports.lastWeekPrePer ? $("#lastWeekPremiumPer").html(weekReports.lastWeekPrePer + '%') : $("#lastWeekPremiumPer").html('No NB Two Weeks Ago');
      weekReports.lastWeekPolPer ? $("#lastWeekPoliciesPer").html(weekReports.lastWeekPolPer + '%') : $("#lastWeekPoliciesPer").html('No NB Two Weeks Ago') ;
      var elementPol = document.getElementById('lastWeekPoliciesPer');
      if(!weekReports.lastWeekPolPer || weekReports.lastWeekPolPer < 0){ 
        elementPol.classList.add("text-danger");
      }else {
        elementPol.classList.add("text-success");
      }
      var elementPrem = document.getElementById('lastWeekPremiumPer');
      if(!weekReports.lastWeekPrePer || weekReports.lastWeekPrePer < 0){ 
        elementPrem.classList.add("text-danger");
      }else {
        elementPrem.classList.add("text-success");
      }
    
      let colors = [config.colors.warning, config.colors.warning, config.colors.warning,  config.colors.warning,  config.colors.warning,  config.colors.warning,  config.colors.warning];
      colors[weekReports.weekPremMax] = config.colors.primary;

      // Revenue Growth Chart
      // --------------------------------------------------------------------
      const revenueGrowthEl = document.querySelector('#revenueGrowth'),
        revenueGrowthConfig = {
          chart: {
            height: 170,
            type: 'bar',
            parentHeightOffset: 0,
            toolbar: {
              show: false
            }
          },
          plotOptions: {
            bar: {
              barHeight: '80%',
              columnWidth: '30%',
              startingShape: 'rounded',
              endingShape: 'rounded',
              borderRadius: 6,
              distributed: true
            }
          },
          tooltip: {
            enabled: false
          },
          grid: {
            show: false,
            padding: {
              top: -20,
              bottom: -12,
              left: -10,
              right: 0
            }
          },
          colors: colors,
          dataLabels: {
            enabled: false
          },
          series: [
            {
              data: weekReports.weekSales
            }
          ],
          legend: {
            show: false
          },
          xaxis: {
            categories: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            axisBorder: {
              show: false
            },
            axisTicks: {
              show: false
            },
            labels: {
              style: {
                colors: labelColor,
                fontSize: '13px',
                fontFamily: 'Public Sans'
              }
            }
          },
          yaxis: {
            labels: {
              show: false
            }
          },
          states: {
            hover: {
              filter: {
                type: 'none'
              }
            }
          },
          responsive: [
            {
              breakpoint: 1471,
              options: {
                plotOptions: {
                  bar: {
                    columnWidth: '50%'
                  }
                }
              }
            },
            {
              breakpoint: 1350,
              options: {
                plotOptions: {
                  bar: {
                    columnWidth: '57%'
                  }
                }
              }
            },
            {
              breakpoint: 1032,
              options: {
                plotOptions: {
                  bar: {
                    columnWidth: '60%'
                  }
                }
              }
            },
            {
              breakpoint: 992,
              options: {
                plotOptions: {
                  bar: {
                    columnWidth: '40%',
                    borderRadius: 8
                  }
                }
              }
            },
            {
              breakpoint: 855,
              options: {
                plotOptions: {
                  bar: {
                    columnWidth: '50%',
                    borderRadius: 6
                  }
                }
              }
            },
            {
              breakpoint: 440,
              options: {
                plotOptions: {
                  bar: {
                    columnWidth: '40%'
                  }
                }
              }
            },
            {
              breakpoint: 381,
              options: {
                plotOptions: {
                  bar: {
                    columnWidth: '45%'
                  }
                }
              }
            }
          ]
        };
      if (typeof revenueGrowthEl !== undefined && revenueGrowthEl !== null) {
        const revenueGrowth = new ApexCharts(revenueGrowthEl, revenueGrowthConfig);
        revenueGrowth.render();
      }
  })

  fetch('/users/dashboard/totalSalesStatistics', {
    method: 'POST'
  }).then((response)=>{
    return response.json()
  }).then(lastMonthTOTReportsChart => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic'];
        const lastMonths = (array) => {
          const actualMonth = new Date().getMonth();
          const result = [];
          for (let j = actualMonth; j > actualMonth - 9; j--) {
            if (j >= 0) {
              result.push(array[j])
            } else {
              result.push(array[j + 12])
            }
          }
          return result.reverse();
        }
      
        // Earning Reports Tabs Function
        function totReportsBarChart(arrayData, highlightData) {
          const basicColor = config.colors.warning,
            highlightColor = config.colors.primary;
          var colorArr = [];
      
          for (let i = 0; i < arrayData.length; i++) {
            if (i === highlightData) {
              colorArr.push(highlightColor);
            } else {
              colorArr.push(basicColor);
            }
          }
      
          const earningReportBarChartOpt = {
            chart: {
              height: 258,
              parentHeightOffset: 0,
              type: 'bar',
              toolbar: {
                show: false
              }
            },
            plotOptions: {
              bar: {
                columnWidth: '32%',
                startingShape: 'rounded',
                borderRadius: 7,
                distributed: true,
                dataLabels: {
                  position: 'top'
                }
              }
            },
            grid: {
              show: false,
              padding: {
                top: 0,
                bottom: 0,
                left: -10,
                right: -10
              }
            },
            colors: colorArr,
            dataLabels: {
              enabled: true,
              formatter: function (val) {
                return parseInt(val) != 0 ? parseInt(val) + 'K' : parseFloat(val)*1000;
              },
              offsetY: -20,
              style: {
                fontSize: '15px',
                colors: [legendColor],
                fontWeight: '500',
                fontFamily: 'Public Sans'
              }
            },
            series: [
              {
                data: arrayData
              }
            ],
            legend: {
              show: false
            },
            tooltip: {
              enabled: false
            },
            xaxis: {
              categories: lastMonths(months),
              axisBorder: {
                show: true,
                color: borderColor
              },
              axisTicks: {
                show: false
              },
              labels: {
                style: {
                  colors: labelColor,
                  fontSize: '13px',
                  fontFamily: 'Public Sans'
                }
              }
            },
            yaxis: {
              labels: {
                offsetX: -15,
                formatter: function (val) {
                  return parseInt(val / 1) + 'k';
                },
                style: {
                  fontSize: '13px',
                  colors: labelColor,
                  fontFamily: 'Public Sans'
                },
                min: 0,
                max: 60000,
                tickAmount: 6
              }
            },
            responsive: [
              {
                breakpoint: 1441,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '41%'
                    }
                  }
                }
              },
              {
                breakpoint: 590,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '61%',
                      borderRadius: 5
                    }
                  },
                  yaxis: {
                    labels: {
                      show: false
                    }
                  },
                  grid: {
                    padding: {
                      right: 0,
                      left: -20
                    }
                  },
                  dataLabels: {
                    style: {
                      fontSize: '12px',
                      fontWeight: '400'
                    }
                  }
                }
              }
            ]
          };
          return earningReportBarChartOpt;
        }
      
        // Earning Chart JSON data


    // Earning Reports Tabs Orders

      // Earning Reports Tabs Sales
      // --------------------------------------------------------------------
      const earningReportsTabsSalesEl = document.querySelector('#earningReportsTabsOrders'),
        earningReportsTabsSalesConfig = totReportsBarChart(
          lastMonthTOTReportsChart['data'][0]['chart_data'],
          lastMonthTOTReportsChart['data'][0]['active_option']
        );

      if (typeof earningReportsTabsSalesEl !== undefined && earningReportsTabsSalesEl !== null) {
        const earningReportsTabsSales = new ApexCharts(earningReportsTabsSalesEl, earningReportsTabsSalesConfig);
        earningReportsTabsSales.render();
      }
  })

  fetch('/users/dashboard/nbSalesStatistics', {
    method: 'POST'
  }).then((response)=>{
    return response.json()
  }).then(lastMonthNBReportsChart => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic'];
        const lastMonths = (array) => {
          const actualMonth = new Date().getMonth();
          const result = [];
          for (let j = actualMonth; j > actualMonth - 9; j--) {
            if (j >= 0) {
              result.push(array[j])
            } else {
              result.push(array[j + 12])
            }
          }
          return result.reverse();
        }
      
        // Earning Reports Tabs Function
        function nbReportsBarChart(arrayData, highlightData) {
          const basicColor = config.colors.warning,
            highlightColor = config.colors.primary;
          var colorArr = [];
      
          for (let i = 0; i < arrayData.length; i++) {
            if (i === highlightData) {
              colorArr.push(highlightColor);
            } else {
              colorArr.push(basicColor);
            }
          }
      
          const earningReportBarChartOpt = {
            chart: {
              height: 258,
              parentHeightOffset: 0,
              type: 'bar',
              toolbar: {
                show: false
              }
            },
            plotOptions: {
              bar: {
                columnWidth: '32%',
                startingShape: 'rounded',
                borderRadius: 7,
                distributed: true,
                dataLabels: {
                  position: 'top'
                }
              }
            },
            grid: {
              show: false,
              padding: {
                top: 0,
                bottom: 0,
                left: -10,
                right: -10
              }
            },
            colors: colorArr,
            dataLabels: {
              enabled: true,
              formatter: function (val) {
                return parseInt(val) != 0 ? parseInt(val) + 'K' : parseFloat(val)*1000;
              },
              offsetY: -20,
              style: {
                fontSize: '15px',
                colors: [legendColor],
                fontWeight: '500',
                fontFamily: 'Public Sans'
              }
            },
            series: [
              {
                data: arrayData
              }
            ],
            legend: {
              show: false
            },
            tooltip: {
              enabled: false
            },
            xaxis: {
              categories: lastMonths(months),
              axisBorder: {
                show: true,
                color: borderColor
              },
              axisTicks: {
                show: false
              },
              labels: {
                style: {
                  colors: labelColor,
                  fontSize: '13px',
                  fontFamily: 'Public Sans'
                }
              }
            },
            yaxis: {
              labels: {
                offsetX: -15,
                formatter: function (val) {
                  return parseInt(val / 1) + 'k';
                },
                style: {
                  fontSize: '13px',
                  colors: labelColor,
                  fontFamily: 'Public Sans'
                },
                min: 0,
                max: 60000,
                tickAmount: 6
              }
            },
            responsive: [
              {
                breakpoint: 1441,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '41%'
                    }
                  }
                }
              },
              {
                breakpoint: 590,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '61%',
                      borderRadius: 5
                    }
                  },
                  yaxis: {
                    labels: {
                      show: false
                    }
                  },
                  grid: {
                    padding: {
                      right: 0,
                      left: -20
                    }
                  },
                  dataLabels: {
                    style: {
                      fontSize: '12px',
                      fontWeight: '400'
                    }
                  }
                }
              }
            ]
          };
          return earningReportBarChartOpt;
        }
      
        // Earning Chart JSON data


    // Earning Reports Tabs Orders

      // Earning Reports Tabs Sales
      // --------------------------------------------------------------------
      const earningReportsTabsSalesEl = document.querySelector('#earningReportsTabsSales'),
        earningReportsTabsSalesConfig = nbReportsBarChart(
          lastMonthNBReportsChart['data'][0]['chart_data'],
          lastMonthNBReportsChart['data'][0]['active_option']
        );

      if (typeof earningReportsTabsSalesEl !== undefined && earningReportsTabsSalesEl !== null) {
        const earningReportsTabsSales = new ApexCharts(earningReportsTabsSalesEl, earningReportsTabsSalesConfig);
        earningReportsTabsSales.render();
      }
  })

  fetch('/users/dashboard/rnSalesStatistics', {
    method: 'POST'
  }).then((response)=>{
    return response.json()
  }).then(lastMonthRNReportsChart => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic'];
        const lastMonths = (array) => {
          const actualMonth = new Date().getMonth();
          const result = [];
          for (let j = actualMonth; j > actualMonth - 9; j--) {
            if (j >= 0) {
              result.push(array[j])
            } else {
              result.push(array[j + 12])
            }
          }
          return result.reverse();
        }
      
        // Earning Reports Tabs Function
        function rnReportsBarChart(arrayData, highlightData) {
          const basicColor = config.colors.warning,
            highlightColor = config.colors.primary;
          var colorArr = [];
      
          for (let i = 0; i < arrayData.length; i++) {
            if (i === highlightData) {
              colorArr.push(highlightColor);
            } else {
              colorArr.push(basicColor);
            }
          }
      
          const earningReportBarChartOpt = {
            chart: {
              height: 258,
              parentHeightOffset: 0,
              type: 'bar',
              toolbar: {
                show: false
              }
            },
            plotOptions: {
              bar: {
                columnWidth: '32%',
                startingShape: 'rounded',
                borderRadius: 7,
                distributed: true,
                dataLabels: {
                  position: 'top'
                }
              }
            },
            grid: {
              show: false,
              padding: {
                top: 0,
                bottom: 0,
                left: -10,
                right: -10
              }
            },
            colors: colorArr,
            dataLabels: {
              enabled: true,
              formatter: function (val) {
                return parseInt(val) != 0 ? parseInt(val) + 'K' : parseFloat(val)*1000;
              },
              offsetY: -20,
              style: {
                fontSize: '15px',
                colors: [legendColor],
                fontWeight: '500',
                fontFamily: 'Public Sans'
              }
            },
            series: [
              {
                data: arrayData
              }
            ],
            legend: {
              show: false
            },
            tooltip: {
              enabled: false
            },
            xaxis: {
              categories: lastMonths(months),
              axisBorder: {
                show: true,
                color: borderColor
              },
              axisTicks: {
                show: false
              },
              labels: {
                style: {
                  colors: labelColor,
                  fontSize: '13px',
                  fontFamily: 'Public Sans'
                }
              }
            },
            yaxis: {
              labels: {
                offsetX: -15,
                formatter: function (val) {
                  return parseInt(val / 1) + 'k';
                },
                style: {
                  fontSize: '13px',
                  colors: labelColor,
                  fontFamily: 'Public Sans'
                },
                min: 0,
                max: 60000,
                tickAmount: 6
              }
            },
            responsive: [
              {
                breakpoint: 1441,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '41%'
                    }
                  }
                }
              },
              {
                breakpoint: 590,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '61%',
                      borderRadius: 5
                    }
                  },
                  yaxis: {
                    labels: {
                      show: false
                    }
                  },
                  grid: {
                    padding: {
                      right: 0,
                      left: -20
                    }
                  },
                  dataLabels: {
                    style: {
                      fontSize: '12px',
                      fontWeight: '400'
                    }
                  }
                }
              }
            ]
          };
          return earningReportBarChartOpt;
        }
      
        // Earning Chart JSON data


    // Earning Reports Tabs Orders

          // Earning Reports Tabs Profit
      // --------------------------------------------------------------------
      const earningReportsTabsProfitEl = document.querySelector('#earningReportsTabsProfit'),
        earningReportsTabsProfitConfig = rnReportsBarChart(
          lastMonthRNReportsChart['data'][0]['chart_data'],
          lastMonthRNReportsChart['data'][0]['active_option']
        );
      if (typeof earningReportsTabsProfitEl !== undefined && earningReportsTabsProfitEl !== null) {
        const earningReportsTabsProfit = new ApexCharts(earningReportsTabsProfitEl, earningReportsTabsProfitConfig);
        earningReportsTabsProfit.render();
      }
  })

  fetch('/users/dashboard/rwSalesStatistics', {
    method: 'POST'
  }).then((response)=>{
    return response.json()
  }).then(lastMonthRWReportsChart => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic'];
        const lastMonths = (array) => {
          const actualMonth = new Date().getMonth();
          const result = [];
          for (let j = actualMonth; j > actualMonth - 9; j--) {
            if (j >= 0) {
              result.push(array[j])
            } else {
              result.push(array[j + 12])
            }
          }
          return result.reverse();
        }
      
        // Earning Reports Tabs Function
        function rnReportsBarChart(arrayData, highlightData) {
          const basicColor = config.colors.warning,
            highlightColor = config.colors.primary;
          var colorArr = [];
      
          for (let i = 0; i < arrayData.length; i++) {
            if (i === highlightData) {
              colorArr.push(highlightColor);
            } else {
              colorArr.push(basicColor);
            }
          }
      
          const earningReportBarChartOpt = {
            chart: {
              height: 258,
              parentHeightOffset: 0,
              type: 'bar',
              toolbar: {
                show: false
              }
            },
            plotOptions: {
              bar: {
                columnWidth: '32%',
                startingShape: 'rounded',
                borderRadius: 7,
                distributed: true,
                dataLabels: {
                  position: 'top'
                }
              }
            },
            grid: {
              show: false,
              padding: {
                top: 0,
                bottom: 0,
                left: -10,
                right: -10
              }
            },
            colors: colorArr,
            dataLabels: {
              enabled: true,
              formatter: function (val) {
                return parseInt(val) != 0 ? parseInt(val) + 'K' : parseFloat(val)*1000;
              },
              offsetY: -20,
              style: {
                fontSize: '15px',
                colors: [legendColor],
                fontWeight: '500',
                fontFamily: 'Public Sans'
              }
            },
            series: [
              {
                data: arrayData
              }
            ],
            legend: {
              show: false
            },
            tooltip: {
              enabled: false
            },
            xaxis: {
              categories: lastMonths(months),
              axisBorder: {
                show: true,
                color: borderColor
              },
              axisTicks: {
                show: false
              },
              labels: {
                style: {
                  colors: labelColor,
                  fontSize: '13px',
                  fontFamily: 'Public Sans'
                }
              }
            },
            yaxis: {
              labels: {
                offsetX: -15,
                formatter: function (val) {
                  return parseInt(val / 1) + 'k';
                },
                style: {
                  fontSize: '13px',
                  colors: labelColor,
                  fontFamily: 'Public Sans'
                },
                min: 0,
                max: 60000,
                tickAmount: 6
              }
            },
            responsive: [
              {
                breakpoint: 1441,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '41%'
                    }
                  }
                }
              },
              {
                breakpoint: 590,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '61%',
                      borderRadius: 5
                    }
                  },
                  yaxis: {
                    labels: {
                      show: false
                    }
                  },
                  grid: {
                    padding: {
                      right: 0,
                      left: -20
                    }
                  },
                  dataLabels: {
                    style: {
                      fontSize: '12px',
                      fontWeight: '400'
                    }
                  }
                }
              }
            ]
          };
          return earningReportBarChartOpt;
        }
      
        // Earning Chart JSON data


    // Earning Reports Tabs Orders

          // Earning Reports Tabs Profit
      // --------------------------------------------------------------------
      const earningReportsTabsProfitEl = document.querySelector('#earningReportsTabsIncome'),
        earningReportsTabsProfitConfig = rnReportsBarChart(
          lastMonthRWReportsChart['data'][0]['chart_data'],
          lastMonthRWReportsChart['data'][0]['active_option']
        );
      if (typeof earningReportsTabsProfitEl !== undefined && earningReportsTabsProfitEl !== null) {
        const earningReportsTabsProfit = new ApexCharts(earningReportsTabsProfitEl, earningReportsTabsProfitConfig);
        earningReportsTabsProfit.render();
      }
  })

  fetch('/users/dashboard/cnSalesStatistics', {
    method: 'POST'
  }).then((response)=>{
    return response.json()
  }).then(lastMonthCNReportsChart => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic'];
        const lastMonths = (array) => {
          const actualMonth = new Date().getMonth();
          const result = [];
          for (let j = actualMonth; j > actualMonth - 9; j--) {
            if (j >= 0) {
              result.push(array[j])
            } else {
              result.push(array[j + 12])
            }
          }
          return result.reverse();
        }
      
        // Earning Reports Tabs Function
        function cnReportsBarChart(arrayData, highlightData) {
          const basicColor = config.colors.warning,
            highlightColor = config.colors.primary;
          var colorArr = [];
      
          for (let i = 0; i < arrayData.length; i++) {
            if (i === highlightData) {
              colorArr.push(highlightColor);
            } else {
              colorArr.push(basicColor);
            }
          }
      
          const earningReportBarChartOpt = {
            chart: {
              height: 258,
              parentHeightOffset: 0,
              type: 'bar',
              toolbar: {
                show: false
              }
            },
            plotOptions: {
              bar: {
                columnWidth: '32%',
                startingShape: 'rounded',
                borderRadius: 7,
                distributed: true,
                dataLabels: {
                  position: 'top'
                }
              }
            },
            grid: {
              show: false,
              padding: {
                top: 0,
                bottom: 0,
                left: -10,
                right: -10
              }
            },
            colors: colorArr,
            dataLabels: {
              enabled: true,
              formatter: function (val) {
                return parseInt(val) != 0 ? parseInt(val) + 'K' : parseFloat(val)*1000;
              },
              offsetY: -20,
              style: {
                fontSize: '15px',
                colors: [legendColor],
                fontWeight: '500',
                fontFamily: 'Public Sans'
              }
            },
            series: [
              {
                data: arrayData
              }
            ],
            legend: {
              show: false
            },
            tooltip: {
              enabled: false
            },
            xaxis: {
              categories: lastMonths(months),
              axisBorder: {
                show: true,
                color: borderColor
              },
              axisTicks: {
                show: false
              },
              labels: {
                style: {
                  colors: labelColor,
                  fontSize: '13px',
                  fontFamily: 'Public Sans'
                }
              }
            },
            yaxis: {
              labels: {
                offsetX: -15,
                formatter: function (val) {
                  return parseInt(val / 1) + 'k';
                },
                style: {
                  fontSize: '13px',
                  colors: labelColor,
                  fontFamily: 'Public Sans'
                },
                min: 0,
                max: 60000,
                tickAmount: 6
              }
            },
            responsive: [
              {
                breakpoint: 1441,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '41%'
                    }
                  }
                }
              },
              {
                breakpoint: 590,
                options: {
                  plotOptions: {
                    bar: {
                      columnWidth: '61%',
                      borderRadius: 5
                    }
                  },
                  yaxis: {
                    labels: {
                      show: false
                    }
                  },
                  grid: {
                    padding: {
                      right: 0,
                      left: -20
                    }
                  },
                  dataLabels: {
                    style: {
                      fontSize: '12px',
                      fontWeight: '400'
                    }
                  }
                }
              }
            ]
          };
          return earningReportBarChartOpt;
        }
      
        // Earning Chart JSON data


    // Earning Reports Tabs Orders

      // --------------------------------------------------------------------
      const earningReportsTabsProfitEl = document.querySelector('#earningReportsTabsCancelations'),
        earningReportsTabsProfitConfig = cnReportsBarChart(
          lastMonthCNReportsChart['data'][0]['chart_data'],
          lastMonthCNReportsChart['data'][0]['active_option']
        );
      if (typeof earningReportsTabsProfitEl !== undefined && earningReportsTabsProfitEl !== null) {
        const earningReportsTabsProfit = new ApexCharts(earningReportsTabsProfitEl, earningReportsTabsProfitConfig);
        earningReportsTabsProfit.render();
      }
  })

})();
