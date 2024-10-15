function exportToExcel(table){
    $(table).table2excel({
    exclude: ".no-export",
    filename: "ebenefit.xls",
    fileext: ".xls",
    exclude_links: false,
    exclude_inputs: true
  });
  }


  $("#csvFile").change(function(){
    formFile = document.querySelector("#csvFile");
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        console.log('The File APIs are not fully supported in this browser.');
        return;
      }
    
      if (!formFile.files) {
        console.log("This browser doesn't seem to support the `files` property of file inputs.");
      } else if (!formFile.files[0]) {
        console.log("No file selected.");
      } else {
        let file = formFile.files[0];
        let fr = new FileReader();
        fr.onload = receivedText;
        fr.readAsText(file);
    
        function receivedText() {
          //console.log(fr.result);
          var table_container = document.getElementById('template_table');
          csv_string_to_table(fr.result,table_container)
        }
      }      
})

function csv_string_to_table(csv_string, element_to_insert_table) {
    var rows = csv_string.trim().split(/\r?\n|\r/); // Regex to split/separate the CSV rows    
    var table = '';
    var table_rows = '';
    var table_header = '';
  

    rows.forEach(function(row, row_index) {
      $(".remove").hide()
        var table_columns = '';
        
        var columns = row.split(','); // split/separate the columns in a row
       
        columns.forEach(function(column, column_index) {
            table_columns += row_index == 0 ? '<th>' + column + '</th>' : '<td>' + column + '</td>';
        });
        if (row_index == 0) {
            table_header += '<tr>' + table_columns + '</tr>';
        } else {
            table_rows += '<tr>' + table_columns + '</tr>';
        }
    });

    table += '<table class="table table-striped rounded">';
        table += '<thead>';
            table += table_header;
        table += '</thead>';
        table += '<tbody>';
            table += table_rows;
        table += '</tbody>';
    table += '</table>';

    element_to_insert_table.innerHTML += table;
    asemRow(rows)  
}

function asemRow(rows){
  product=[]
  for(let i=1;i<=rows.length-1;i++){
      r=rows[i].split(",");
      product.push({
          employee_name:r[0],
          employee_number:r[1],
          dba_code:r[2],
          deduct_amount:r[3],          
      })
  }
  sessionStorage.setItem("employees",JSON.stringify(product))
}


$("#mfb-form").submit(async (e)=>{
  e.preventDefault();
  if($("#pin").val()=="8098"){
      employee=JSON.parse(sessionStorage.getItem("employees"))
      $("#subbtn").html(`<div class="spinner-border" role="status">
      <span class="sr-only">Loading...</span>
    </div>`)
    $("#table-container").html(`<div class="spinner-border" role="status">
    <span class="sr-only">Loading...</span>
    </div>`);
    // console.log(employee)
      month=$("#month").val();
      year=$("#year").val();
      var data=await uploadData(month,year,employee);
      $(data).ready(()=>{
        data.message=data.error==false || data.error=='false'?data.message:"Uploaded Successfully!"
      })
    
      alert(data.message);
    
      $(".success-message").html(`
        ${data.message}
      `)
    
    
      $("#subbtn").html(`Submit`)
      $("#subbtn").addClass(" disabled");
      $("#table-container").html("");
  }
  else{
    alert("Invalid Pin")
  }
 
  
})


function uploadData(month,year,employee){
  console.log("sss")
  var settings = {
      "url": "./uploadMfb",
      "method": "POST",
      "timeout": 0,
      "headers": {
        'Content-Type': 'application/x-www-form-urlencoded',        
      },
      "data": {
          month:month,
          year:year,
          deductions:JSON.stringify(employee)
      }
    };
    return new Promise(resolve => {
      $.ajax(settings).done(function (response, status) {
        //console.log(status);
        resolve(response);
      });
  });
}
