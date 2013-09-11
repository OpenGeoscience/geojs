var staticWorkflows = {
  "Default": {
    "workflow": {
      "@name": "untitled",
      "@version": "1.0.3",
      "@{http://www.w3.org/2001/XMLSchema-instance}schemaLocation": "http://www.vistrails.org/workflow.xsd",
      "connection": [{
        "#tail": "\n  ",
        "#text": "\n    ",
        "@id": "0",
        "port": [{
          "@moduleName": "Dataset",
          "@name": "self",
          "#tail": "\n    ",
          "@signature": "(org.opengeoscience.geojs.climate:Dataset)",
          "@id": "0",
          "@type": "source",
          "@moduleId": "0"
        }, {
          "@moduleName": "Variable",
          "@name": "dataset",
          "#tail": "\n  ",
          "@signature": "(org.opengeoscience.geojs.climate:Dataset)",
          "@id": "1",
          "@type": "destination",
          "@moduleId": "1"
        }]
      }, {
        "#tail": "\n  ",
        "#text": "\n    ",
        "@id": "1",
        "port": [{
          "@moduleName": "Variable",
          "@name": "self",
          "#tail": "\n    ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "2",
          "@type": "source",
          "@moduleId": "1"
        }, {
          "@moduleName": "ToGeoJSON",
          "@name": "variable",
          "#tail": "\n  ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "3",
          "@type": "destination",
          "@moduleId": "2"
        }]
      }],
      "module": [{
        "@name": "Dataset",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n  ",
        "@cache": "1",
        "location": {
          "#tail": "\n  ",
          "@x": "320.0",
          "@y": "-120.0",
          "@id": "0"
        },
        "#text": "\n    ",
        "@id": "0"
      }, {
        "@name": "Variable",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n  ",
        "@cache": "1",
        "location": {
          "#tail": "\n  ",
          "@x": "750.0",
          "@y": "-160.0",
          "@id": "1"
        },
        "#text": "\n    ",
        "@id": "1"
      }, {
        "@name": "ToGeoJSON",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n",
        "@cache": "1",
        "location": {
          "#tail": "\n  ",
          "@x": "1200.0",
          "@y": "-260.0",
          "@id": "2"
        },
        "#text": "\n    ",
        "@id": "2"
      }],
      "@vistrail_id": "",
      "#text": "\n  ",
      "@id": "0"
    }
  },
  "10 Year Average": {
    "workflow": {
      "@name": "untitled",
      "@version": "1.0.3",
      "@{http://www.w3.org/2001/XMLSchema-instance}schemaLocation": "http://www.vistrails.org/workflow.xsd",
      "connection": [{
        "#tail": "\n  ",
        "#text": "\n    ",
        "@id": "1",
        "port": [{
          "@moduleName": "Dataset",
          "@name": "self",
          "#tail": "\n    ",
          "@signature": "(org.opengeoscience.geojs.climate:Dataset)",
          "@id": "2",
          "@type": "source",
          "@moduleId": "1"
        }, {
          "@moduleName": "Variable",
          "@name": "dataset",
          "#tail": "\n  ",
          "@signature": "(org.opengeoscience.geojs.climate:Dataset)",
          "@id": "3",
          "@type": "destination",
          "@moduleId": "2"
        }]
      }, {
        "#tail": "\n  ",
        "#text": "\n    ",
        "@id": "2",
        "port": [{
          "@moduleName": "Variable",
          "@name": "self",
          "#tail": "\n    ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "4",
          "@type": "source",
          "@moduleId": "2"
        }, {
          "@moduleName": "SubSelect",
          "@name": "variable",
          "#tail": "\n  ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "5",
          "@type": "destination",
          "@moduleId": "3"
        }]
      }, {
        "#tail": "\n  ",
        "#text": "\n    ",
        "@id": "3",
        "port": [{
          "@moduleName": "SubSelect",
          "@name": "variable",
          "#tail": "\n    ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "6",
          "@type": "source",
          "@moduleId": "3"
        }, {
          "@moduleName": "MonthlyTimeBounds",
          "@name": "variable",
          "#tail": "\n  ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "7",
          "@type": "destination",
          "@moduleId": "4"
        }]
      }, {
        "#tail": "\n  ",
        "#text": "\n    ",
        "@id": "4",
        "port": [{
          "@moduleName": "MonthlyTimeBounds",
          "@name": "variable",
          "#tail": "\n    ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "8",
          "@type": "source",
          "@moduleId": "4"
        }, {
          "@moduleName": "Average",
          "@name": "variable",
          "#tail": "\n  ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "9",
          "@type": "destination",
          "@moduleId": "5"
        }]
      }, {
        "#tail": "\n  ",
        "#text": "\n    ",
        "@id": "5",
        "port": [{
          "@moduleName": "Average",
          "@name": "variable",
          "#tail": "\n    ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "10",
          "@type": "source",
          "@moduleId": "5"
        }, {
          "@moduleName": "ToGeoJSON",
          "@name": "variable",
          "#tail": "\n  ",
          "@signature": "(org.opengeoscience.geojs.climate:Variable)",
          "@id": "11",
          "@type": "destination",
          "@moduleId": "6"
        }]
      }],
      "module": [{
        "function": {
          "@name": "file",
          "#tail": "\n  ",
          "@id": "6",
          "@pos": "0",
          "#text": "\n      ",
          "parameter": {
            "@val": "",
            "@name": "<no description>",
            "#tail": "\n    ",
            "@pos": "0",
            "@alias": "",
            "@id": "8",
            "@type": "org.vistrails.vistrails.basic:String"
          }
        },
        "@name": "Dataset",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n  ",
        "@cache": "1",
        "location": {
          "#tail": "\n    ",
          "@x": "-259.0",
          "@y": "-33.0",
          "@id": "1"
        },
        "#text": "\n    ",
        "@id": "1"
      }, {
        "function": {
          "@name": "name",
          "#tail": "\n  ",
          "@id": "1",
          "@pos": "0",
          "#text": "\n      ",
          "parameter": {
            "@val": "",
            "@name": "<no description>",
            "#tail": "\n    ",
            "@pos": "0",
            "@alias": "",
            "@id": "9",
            "@type": "org.vistrails.vistrails.basic:String"
          }
        },
        "@name": "Variable",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n  ",
        "@cache": "1",
        "location": {
          "#tail": "\n    ",
          "@x": "50.0",
          "@y": "-177.0",
          "@id": "7"
        },
        "#text": "\n    ",
        "@id": "2"
      }, {
        "function": [{
          "@name": "axis",
          "#tail": "\n    ",
          "@id": "2",
          "@pos": "0",
          "#text": "\n      ",
          "parameter": {
            "@val": "time",
            "@name": "<no description>",
            "#tail": "\n    ",
            "@pos": "0",
            "@alias": "",
            "@id": "2",
            "@type": "org.vistrails.vistrails.basic:String"
          }
        }, {
          "@name": "end",
          "#tail": "\n    ",
          "@id": "3",
          "@pos": "1",
          "#text": "\n      ",
          "parameter": {
            "@val": "1983-01-01",
            "@name": "<no description>",
            "#tail": "\n    ",
            "@pos": "0",
            "@alias": "",
            "@id": "3",
            "@type": "org.vistrails.vistrails.basic:String"
          }
        }, {
          "@name": "start",
          "#tail": "\n  ",
          "@id": "4",
          "@pos": "2",
          "#text": "\n      ",
          "parameter": {
            "@val": "1973-01-01",
            "@name": "<no description>",
            "#tail": "\n    ",
            "@pos": "0",
            "@alias": "",
            "@id": "4",
            "@type": "org.vistrails.vistrails.basic:String"
          }
        }],
        "@name": "SubSelect",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n  ",
        "@cache": "1",
        "location": {
          "#tail": "\n    ",
          "@x": "380.0",
          "@y": "-208.0",
          "@id": "3"
        },
        "#text": "\n    ",
        "@id": "3"
      }, {
        "@name": "MonthlyTimeBounds",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n  ",
        "@cache": "1",
        "location": {
          "#tail": "\n  ",
          "@x": "705.0",
          "@y": "-336.0",
          "@id": "4"
        },
        "#text": "\n    ",
        "@id": "4"
      }, {
        "function": {
          "@name": "axis",
          "#tail": "\n  ",
          "@id": "5",
          "@pos": "0",
          "#text": "\n      ",
          "parameter": {
            "@val": "t",
            "@name": "<no description>",
            "#tail": "\n    ",
            "@pos": "0",
            "@alias": "",
            "@id": "5",
            "@type": "org.vistrails.vistrails.basic:String"
          }
        },
        "@name": "Average",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n  ",
        "@cache": "1",
        "location": {
          "#tail": "\n    ",
          "@x": "992.0",
          "@y": "-508.0",
          "@id": "5"
        },
        "#text": "\n    ",
        "@id": "5"
      }, {
        "@name": "ToGeoJSON",
        "@package": "org.opengeoscience.geojs.climate",
        "@version": "0.9.0",
        "@namespace": "",
        "#tail": "\n",
        "@cache": "1",
        "location": {
          "#tail": "\n  ",
          "@x": "1317.0",
          "@y": "-532.0",
          "@id": "6"
        },
        "#text": "\n    ",
        "@id": "6"
      }],
      "@vistrail_id": "",
      "#text": "\n  ",
      "@id": "0"
    }
  }
};
