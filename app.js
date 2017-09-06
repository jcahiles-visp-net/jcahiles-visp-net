var accessToken = '';
var hourlyRate = '';
var startDate = '';
var endDate = '';

const holidays = [
    '1/1/2017',
    '1/2/2017',
    '1/28/2017',
    '2/25/2017',
    '4/9/2017',
    '4/13/2017',
    '4/14/2017',
    '4/15/2017',
    '5/1/2017',
    '6/12/2017',
    '6/26/2017',
    '8/21/2017',
    '8/28/2017',
    '6/26/2017',
    '10/31/2017',
    '11/1/2017',
    '11/30/2017',
    '12/25/2017',
    '12/30/2017',
    '12/31/2017',
    '8/28/2017',
];

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
    var worklogDates = generateDatesPerWeek(startDate, endDate);
    const weeks = Object.keys(worklogDates);
    console.log('group by weeks', worklogDates)
    console.log('index of weeks', weeks);
    
    var getAccount = $.get(url, function(data){
        var account = data.accounts[0];
        let weekTotal = {};
        const getWorklogPerDay = async () => {            
            for(let i = 0; i < weeks.length; i++){
                let totalTime = 0;
                let totalHolidaysInWeek = 0;
                for(let j = 0; j < worklogDates[weeks[i]].length; j++){
                    let items = await $.get(generateTimeDoctorURL({
                        company_id: account.company_id,
                        access_token: accessToken,
                        start_date: worklogDates[weeks[i]][j].date,
                        end_date: worklogDates[weeks[i]][j].date,
                        query_type: 'worklogs',
                        consolidated: 0
                    }));
                    worklogDates[weeks[i]][j].items = items.worklogs.items;
                    worklogDates[weeks[i]][j].total = items.total;
                    totalTime += items.total;

                    holidays.forEach(element => {
                        if(moment(element, 'M/D/YYYY').isSame(worklogDates[weeks[i]][j].date)){
                            totalHolidaysInWeek++;
                        }
                    });
                }
                console.log('total time', totalTime);
                weekTotal[weeks[i]] = {};
                weekTotal[weeks[i]].total = totalTime;
                weekTotal[weeks[i]].week_length = 5 - totalHolidaysInWeek;
                weekTotal[weeks[i]].overtime = 5 - totalHolidaysInWeek;                
            }
            console.log('updated the days', worklogDates);
            console.log('total time per week', weekTotal);
        };

        var paidBreakUrl = generateTimeDoctorURL({
            company_id: account.company_id,
            access_token: accessToken,
            start_date: startDate,
            end_date: endDate,
            task_id: 14832166,
            query_type: 'worklogs',
            consolidated: 0
        });

        var unconsolodatedLogs = generateTimeDoctorURL({
            company_id: account.company_id,
            access_token: accessToken,
            start_date: startDate,
            end_date: endDate,
            query_type: 'worklogs',
            consolidated: 0
        });

        var payload = null;
        $.ajax({
            async: false,
            type: 'GET',
            url: paidBreakUrl,
            success: function(data) {
                payload = data.worklogs.items;
            }
        });
        console.log('payload', payload);
        var totalPaidBreak = 0;
        for(var i = 0; i < payload.length; i++){
            if(payload[i].length <= 900){
                totalPaidBreak += parseInt(payload[i].length);
            }
        }
        console.log('total paid break', totalPaidBreak);
        var workLogs = null;
        $.ajax({
            async: false,
            type: 'GET',
            url: unconsolodatedLogs,
            success: function(data) {
                workLogs = data.worklogs.items;
            }
        });

        var totalWorkingTime = 0;
        for(var i = 0; i < workLogs.length; i++){
            if(workLogs[i].task_id == 14832166){
                workLogs.splice(i, 1);
            } else {
                totalWorkingTime += parseInt(workLogs[i].length);
            }
        }
        totalWorkingTime += totalPaidBreak;
        console.log('total work time', totalWorkingTime);

        getWorklogPerDay();
    });
});

var enumerateDaysBetweenDates = function(startDate, endDate) {
    var now = startDate, dates = [];
    
    while (now.isBefore(endDate) || now.isSame(endDate)) {
        dates.push(now.format('YYYY-MM-DD'));
        now.add(1, 'days');
    }
    return dates;
};

var generateDatesPerWeek = function(startDate, endDate){
    var dates = enumerateDaysBetweenDates(moment(startDate), moment(endDate));
    var groupWeeks = {};
    
    for(let i = 0; i < dates.length; i++){
        var index = moment(dates[i]).week();
        if(!(groupWeeks[index] instanceof Array)){
            groupWeeks[index] = [];
        }
    }
    let weeks = Object.keys(groupWeeks);

    for(let i = 0; i < weeks.length; i++){
        let startOfWeek = moment().day("Sunday").week(weeks[i]);
        let endOfWeek = moment().day("Saturday").week(weeks[i]);
        let datesPerWeek = enumerateDaysBetweenDates(moment(startOfWeek), moment(endOfWeek));

        for(let j = 0; j < datesPerWeek.length; j++){
            groupWeeks[weeks[i]].push({date: datesPerWeek[j]});
        }
    }

    return groupWeeks;
}

var generateTimeDoctorURL = function(args){
    var userId = args.user_id ? '&user_ids=' + args.user_id : '';
    var consolidated = typeof args.consolidated == 'number' ? '&consolidated=' + args.consolidated : '';
    var format = args.format ? '&_format=' + args.format : '&_format=json';
    var taskId = args.task_id ? '&task_ids=' + args.task_id : '';

    var baseURL = 'https://webapi.timedoctor.com/v1.1/companies/';
    var basicURL = baseURL + args.company_id + '/' + args.query_type + '?access_token=' + args.access_token + format;
    var queryURL = basicURL + '&start_date=' + args.start_date + '&end_date=' + args.end_date + userId + taskId + consolidated;

    return queryURL;
}