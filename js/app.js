const GOAL_AMOUNT = 111000;
console.log("APP STARTED");

/*
Replace this with your published Google Sheet CSV URL

Example:
https://docs.google.com/spreadsheets/d/XXXXX/export?format=csv
*/


const CSV_URL = "https://docs.google.com/spreadsheets/d/1EELxeBDFyC_Xye3tYct_YvVELuph6AbgFZ9y_vWt_ww/export?format=csv";

let memberData = [];

fetch(CSV_URL)
.then(res => res.text())
.then(csv => {

    const rows = csv.split("\n");

    let totalSaved = 0;

    const monthlyTotals = new Array(12).fill(0);

    

    for(let i=1;i<11;i++)
{
    const cols = rows[i]
        .replace(/\r/g,"")
        .split(",");

    const name = cols[0]?.trim();

    if(!name)
        continue;

    const total =
        Number(cols[14]) || 0;

    memberData.push({
        name:name,
        total:total
    });

    totalSaved += total;

    for(let m=0; m<12; m++)
    {
        const value =
            Number(
                (cols[m+2] || "0").trim()
            ) || 0;

        monthlyTotals[m] += value;
    }
}

console.log("Monthly Totals =", monthlyTotals);

    loadDashboard(totalSaved);

    loadLeaderboard();

    loadMemberCards();

    loadPieChart();

    console.log(JSON.stringify(monthlyTotals));
    console.log("Rows =", rows);

    loadMonthlyChart(monthlyTotals);

});

function calculateMonthlyTotals(members)
{
    const monthlyTotals = new Array(12).fill(0);

    members.forEach(member => {

        member.months.forEach((amount,index) => {

            monthlyTotals[index] += amount;

        });

    });

    return monthlyTotals;
}

function calculateTotalSaved(members)
{
    let total = 0;

    members.forEach(member => {

        total += member.months.reduce(
            (sum,val)=>sum+val,
            0
        );

    });

    return total;
}

function loadDashboard(saved)
{
    const remaining = GOAL_AMOUNT - saved;

    const progress =
        ((saved / GOAL_AMOUNT) * 100).toFixed(2);

    document.getElementById(
        "savedAmount"
    ).innerText =
        "₹" + saved.toLocaleString();

    document.getElementById(
        "remainingAmount"
    ).innerText =
        "₹" + remaining.toLocaleString();

    document.getElementById(
        "memberCount"
    ).innerText =
        memberData.length;

    document.getElementById(
        "progressPercent"
    ).innerText =
        progress + "%";

    document.getElementById(
        "centerAmount"
    ).innerText =
        "₹" + saved.toLocaleString();

    new Chart(
        document.getElementById("goalChart"),
        {
            type:'doughnut',
            data:{
                datasets:[
                {
                    data:[
                        saved,
                        remaining
                    ],
                    backgroundColor:[
                        '#22c55e',
                        '#334155'
                    ],
                    borderWidth:0
                }]
            },
            options:{
                cutout:'75%',
                plugins:{
                    legend:{
                        display:false
                    }
                }
            }
        }
    );
}

function loadPieChart()
{
    new Chart(
        document.getElementById("memberChart"),
        {
            type:'pie',
            data:{
                labels:
                    memberData.map(
                        x=>x.name
                    ),

                datasets:[
                {
                    data:
                        memberData.map(
                            x=>x.total
                        )
                }]
            }
        }
    );
}

function loadMonthlyChart(monthlyTotals)
{
    new Chart(
        document.getElementById("monthlyChart"),
        {
            type:'bar',
            data:{
                labels:[
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec'
                ],
                datasets:[
                {
                    label:'Collection',
                    data:monthlyTotals
                }]
            }
        }
    );
}

function loadLeaderboard()
{
    const container =
        document.getElementById(
            "leaderboard"
        );

    const sorted =
        [...memberData]
        .sort(
            (a,b)=>b.total-a.total
        );

    sorted.slice(0,5)
    .forEach((member,index)=>{

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "leader-item";

        div.innerHTML = `
            <span>
            #${index+1}
            ${member.name}
            </span>

            <strong>
            ₹${member.total}
            </strong>
        `;

        container.appendChild(div);

    });
}

function loadMemberCards()
{
    const container =
        document.getElementById(
            "memberCards"
        );

    container.innerHTML = "";

    memberData.forEach(member=>{

        const expected = 12000;

        const pending =
            expected - member.total;

        const percent =
            Math.min(
                100,
                ((member.total/expected)*100)
            );

        let color="green";

        if(percent < 50)
            color="red";
        else if(percent < 80)
            color="yellow";

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "member-card";

        card.innerHTML = `
            <div class="member-name">
                ${member.name}
            </div>

            <div class="member-row">
                <span>Paid</span>
                <span>₹${member.total}</span>
            </div>

            <div class="member-row">
                <span>Pending</span>
                <span>₹${pending}</span>
            </div>

            <div class="member-row">
                <span>Target</span>
                <span>₹12000</span>
            </div>

            <div class="progress-bar">

                <div
                class="progress-fill ${color}"
                style="
                width:${percent}%">
                </div>

            </div>

            <br>

            <div>
            ${percent.toFixed(0)}%
            </div>
        `;

        container.appendChild(card);

    });
}

document.addEventListener(
"input",
e=>{

    if(
    e.target.id !==
    "searchInput"
    )
    return;

    const text =
    e.target.value
    .toLowerCase();

    document
    .querySelectorAll(
        ".member-card"
    )
    .forEach(card=>{

        const name =
        card.innerText
        .toLowerCase();

        card.style.display =
        name.includes(text)
        ? "block"
        : "none";

    });

});
