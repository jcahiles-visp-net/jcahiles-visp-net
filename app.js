var accessToken = '';
var hourlyRate = '';
var startDate = '';
var endDate = '';

var token = document.getElementById('token');
token.addEventListener('change', function(event){
    accessToken = event.target.value;
});

var rate = document.getElementById('rate');
rate.addEventListener('change', function(event){
    hourlyRate = event.target.value;
});

var wageLabel = document.getElementById('wage');

var start = document.getElementById('start-date');
start.addEventListener('change', function(event){
    startDate = event.target.value;
});

var end = document.getElementById('end-date');
end.addEventListener('change', function(event){
    endDate = event.target.value;
});

var button = document.getElementById('button');
button.addEventListener('click', function(event){
    wageLabel.innerHTML = 'getting account details...'
    var url = 'https://webapi.timedoctor.com/v1.1/companies?access_token='+ accessToken +'&_format=json';
    httpGetAsync(url, function(value){
        var account = JSON.parse(value).accounts[0];
        var worklogUrl = 'https://webapi.timedoctor.com/v1.1/companies/'+ account.company_id +'/worklogs?access_token='+ accessToken 
                         +'&_format=json&start_date='+ startDate +'&end_date='+ endDate +'&user_ids='+ account.user_id;

        wageLabel.innerHTML = 'getting tasks and projects...'
        httpGetAsync(worklogUrl, function(value){
            var wage = JSON.parse(value).total / 3600 * hourlyRate;
            console.log(wage);
            wageLabel.innerHTML = 'Php ' + wage;
        });
    });
});

function httpGetAsync(url, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function(){
        if(xmlHttp.readyState == 4 && xmlHttp.status == 200){
            callback(xmlHttp.responseText);
        }
    }
    xmlHttp.open('GET', url, true);
    xmlHttp.send(null);
}