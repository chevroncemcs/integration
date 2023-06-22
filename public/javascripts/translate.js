function exportToExcel(table){
  $(table).table2excel({
  exclude: ".no-export",
  filename: "download.xls",
  fileext: ".xls",
  exclude_links: false,
  exclude_inputs: true
});
}

$("#bulk-form").submit(async (e)=>{
    e.preventDefault();
    bulk=JSON.parse(sessionStorage.getItem("bulk"))
  
    $("#subbtn").html(`<div class="spinner-border" role="status">
    <span class="sr-only">Loading...</span>
  </div>`)
  $("#table-container").html(`<div class="spinner-border" role="status">
  <span class="sr-only">Loading...</span>
</div>`);

    p=[]
    d=[]
    c=[]
    s=[]
    su=[]
    bulk.forEach(async (pro)=>{
      
      var sql=`insert into cemcs_product (product_id,model,quantity,stock_status_id,manufacturer_id,price) values (${pro.id},1,${pro.quantity},8,0,${pro.price}); `        
      p.push(sql);
      
      
      var dd=`insert into cemcs_product_description (product_id,language_id,name,tag) values (${pro.id},1,'${pro.product_name}','${pro.product_name}'); `
      d.push(dd)

      var cc=`insert into cemcs_product_to_category (product_id,category_id) values (${pro.id},${pro.category_id}); `
      c.push(cc)
      
      var ss=`insert into cemcs_product_to_store (product_id,store_id) values (${pro.id},0);`
      s.push(ss)

      var data=await uploadBulk(sql,dd,cc,ss);
      $(data).ready(()=>{
        data.error==false || data.error=='false'?su.push(pro.id):""
      })
        
    })

    alert("Product Uploaded!");

    $(".success-message").html(`
        Products Uploaded ${su.join(",")}
    `)


    $("#subbtn").html(`Submit`)
    $("#subbtn").addClass(" disabled");
    $("#table-container").html("");
    
})


function uploadBulk(p,d,c,s){
    var settings = {
        "url": "./bulkproduct",
        "method": "POST",
        "timeout": 0,
        "headers": {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "data": {
            p:p,
            d:d,
            c:c,
            s:s
        }
      };
      return new Promise(resolve => {
        $.ajax(settings).done(function (response, status) {
          //console.log(status);
          resolve(response);
        });
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
    flatten(rows)  ;
}

function asemRow(rows){
    product=[]
    for(let i=1;i<rows.length-1;i++){
        r=rows[i].split(",");
        product.push({
            id:r[0],
            category_id:r[1],
            product_name:r[2],
            quantity:r[3],
            price:r[4]
        })
    }
    sessionStorage.setItem("bulk",JSON.stringify(product))
}

function flatten(rows){
  payrollcode=rows[1].split(",")//get payroll codes
  items=[]
  const date=new Date();
  for(i=3;i<rows.length;i++){
    item=rows[i].split(",") // get each line item
    // temp=[item[0],item[1]]
    for(j=2;j<item.length;j++){ //flatten each line item            
      if(parseInt(item[j])!=0 || item[j]==" " || item[j]==""){
        temp=[item[0],item[1],payrollcode[j],item[j],"NULL",`${date.getDate()}-${(date.getMonth()+1)<10?0:''}${date.getMonth()+1}-${date.getFullYear()}`]
        items.push(temp)
      }
    }
  }
  console.log(items)
  
  for(i=0;i<items.length;i++){
    var td=``
    items[i].forEach((x)=>{
      td+=`<td>${x}</td>`
    })
    $("#flatBody").append(`
      <tr id="bo${i}">
        ${td}
      </tr>      
    `)
    
  }
}
