var defaultWorkflow = {
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
        "@signature": "(org.opengeoscience.geoweb.climate:Dataset)",
        "@id": "0",
        "@type": "source",
        "@moduleId": "0"
      }, {
        "@moduleName": "Variable",
        "@name": "dataset",
        "#tail": "\n  ",
        "@signature": "(org.opengeoscience.geoweb.climate:Dataset)",
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
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "2",
        "@type": "source",
        "@moduleId": "1"
      }, {
        "@moduleName": "ToGeoJSON",
        "@name": "variable",
        "#tail": "\n  ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "3",
        "@type": "destination",
        "@moduleId": "2"
      }]
    }],
    "module": [{
      "@name": "Dataset",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n  ",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "20.0",
        "@y": "20.0",
        "@id": "0"
      },
      "#text": "\n    ",
      "@id": "0"
    }, {
      "@name": "Variable",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n  ",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "250.0",
        "@y": "121.0",
        "@id": "1"
      },
      "#text": "\n    ",
      "@id": "1"
    }, {
      "@name": "ToGeoJSON",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "500.0",
        "@y": "240.0",
        "@id": "2"
      },
      "#text": "\n    ",
      "@id": "2"
    }],
    "@vistrail_id": "",
    "#text": "\n  ",
    "@id": "0"
  }
};

var averageWorkflow = {
  "workflow": {
    "@name": "untitled",
    "@version": "1.0.3",
    "@{http://www.w3.org/2001/XMLSchema-instance}schemaLocation": "http://www.vistrails.org/workflow.xsd",
    "connection": [{
      "#tail": "\n  ",
      "#text": "\n    ",
      "@id": "2",
      "port": [{
        "@moduleName": "SubSelect",
        "@name": "variable",
        "#tail": "\n    ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "4",
        "@type": "source",
        "@moduleId": "5"
      }, {
        "@moduleName": "Average",
        "@name": "variable",
        "#tail": "\n  ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "5",
        "@type": "destination",
        "@moduleId": "4"
      }]
    }, {
      "#tail": "\n  ",
      "#text": "\n    ",
      "@id": "3",
      "port": [{
        "@moduleName": "MonthlyTimeBounds",
        "@name": "variable",
        "#tail": "\n    ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "6",
        "@type": "source",
        "@moduleId": "3"
      }, {
        "@moduleName": "SubSelect",
        "@name": "variable",
        "#tail": "\n  ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "7",
        "@type": "destination",
        "@moduleId": "5"
      }]
    }, {
      "#tail": "\n  ",
      "#text": "\n    ",
      "@id": "4",
      "port": [{
        "@moduleName": "Dataset",
        "@name": "self",
        "#tail": "\n    ",
        "@signature": "(org.opengeoscience.geoweb.climate:Dataset)",
        "@id": "8",
        "@type": "source",
        "@moduleId": "0"
      }, {
        "@moduleName": "Variable",
        "@name": "dataset",
        "#tail": "\n  ",
        "@signature": "(org.opengeoscience.geoweb.climate:Dataset)",
        "@id": "9",
        "@type": "destination",
        "@moduleId": "1"
      }]
    }, {
      "#tail": "\n  ",
      "#text": "\n    ",
      "@id": "5",
      "port": [{
        "@moduleName": "Variable",
        "@name": "self",
        "#tail": "\n    ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "10",
        "@type": "source",
        "@moduleId": "1"
      }, {
        "@moduleName": "MonthlyTimeBounds",
        "@name": "variable",
        "#tail": "\n  ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "11",
        "@type": "destination",
        "@moduleId": "3"
      }]
    }, {
      "#tail": "\n  ",
      "#text": "\n    ",
      "@id": "6",
      "port": [{
        "@moduleName": "Average",
        "@name": "variable",
        "#tail": "\n    ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "12",
        "@type": "source",
        "@moduleId": "4"
      }, {
        "@moduleName": "ToGeoJSON",
        "@name": "variable",
        "#tail": "\n  ",
        "@signature": "(org.opengeoscience.geoweb.climate:Variable)",
        "@id": "13",
        "@type": "destination",
        "@moduleId": "2"
      }]
    }],
    "module": [{
      "@name": "Dataset",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n  ",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "-194.0",
        "@y": "165.0",
        "@id": "0"
      },
      "#text": "\n    ",
      "@id": "0"
    }, {
      "@name": "Variable",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n  ",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "-65.0",
        "@y": "121.0",
        "@id": "1"
      },
      "#text": "\n    ",
      "@id": "1"
    }, {
      "@name": "ToGeoJSON",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n  ",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "81.0",
        "@y": "51.0",
        "@id": "2"
      },
      "#text": "\n    ",
      "@id": "2"
    }, {
      "@name": "MonthlyTimeBounds",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n  ",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "-162.0",
        "@y": "8.0",
        "@id": "3"
      },
      "#text": "\n    ",
      "@id": "3"
    }, {
      "@name": "Average",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n  ",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "76.0",
        "@y": "-104.0",
        "@id": "4"
      },
      "#text": "\n    ",
      "@id": "4"
    }, {
      "@name": "SubSelect",
      "@package": "org.opengeoscience.geoweb.climate",
      "@version": "0.9.0",
      "@namespace": "",
      "#tail": "\n",
      "@cache": "1",
      "location": {
        "#tail": "\n  ",
        "@x": "10.0",
        "@y": "-32.0",
        "@id": "5"
      },
      "#text": "\n    ",
      "@id": "5"
    }],
    "@vistrail_id": "",
    "#text": "\n  ",
    "@id": "0"
  }
};
