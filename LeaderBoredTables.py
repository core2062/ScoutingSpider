import csv
import sys
# Define Points as a global variable
Points = {
    'Speaker Autos': 1,
    'Amp Teleop': 2,
    'Speaker Teleop': 1,
    'Match Comments': None,
}

def pointCalc(DataSet, Points):
    PointValuesList = []
    PointList = list(Points.keys())  # Get the list of keys from Points
    
    for key in PointList:  # Use a for loop for simplicity
        try:
            point_value = Points[key]
            dataset_value = float(DataSet.get(key, 0))  # Default to 0 if key is not in DataSet
            result = point_value * dataset_value
            PointValuesList.append(result)  # Add result to the list
            

        except ValueError:
            print(f"Error: Unable to convert {DataSet.get(key, 'N/A')} to float.")
    
    return PointValuesList

def Build2ndTables(data):
    BuiltTable = ""
    point_value = list(data.keys())  # Get the list of keys from the dataset
    for key in point_value:
        BuiltTable += f'<th>{key}</th>\n'
    return BuiltTable

def Build2ndRow(data):
    BuiltTable = ""
    for value in data:
        BuiltTable += f'<td>{value}</td>\n'
    return BuiltTable

def ScriptorEnd(First, Second, text):
    text += '''
        document.getElementById("'''+First+'''").addEventListener('click', function(){
        const targetTable = document.getElementById("'''+Second+'''");

        // Toggle between making the table disappear and reappear
        if (targetTable.style.display === 'none') {
            targetTable.style.display = 'table'; // Reappear
        } else {
            targetTable.style.display = 'none'; // Disappear
        }
    });'''
    return text
        
# Read data from CSV
with open('/CSV/Testing2024_NorthernLightsRegional_Summary.csv', "r") as file:
    CSVRead = csv.DictReader(file)
    data = [row for row in CSVRead] 

x = 0
JStext = ""
HtmlInject = ""

while x < len(data):
    try:
        TotalPointList = pointCalc(data[x], Points)
        
        HtmlInject += f'''
<table id="firstTable:{data[x]['Team Number']}">
    <tbody>
        <tr>
            <td>Team number</td>
            <td>Points</td>
            <td>Position</td>
        </tr> 
        <tr>
            <td>{data[x]['Team Number']}</td>
            <td>{sum(TotalPointList)}</td>
            <td id="position:{data[x]['Team Number']}"></td>
        </tr>
    </tbody>
</table>

<!-- The second table is hidden by default -->
<table id="secondTable:{data[x]['Team Number']}" style="display: none;">
    <thead>
        <tr>
            {Build2ndTables(Points)}
        </tr>
    </thead>
    <tbody>
        <tr>
            {Build2ndRow(TotalPointList)}
        </tr>
    </tbody>
</table>
'''

        JStext = ScriptorEnd(f'firstTable:{data[x]["Team Number"]}', f'secondTable:{data[x]["Team Number"]}', JStext)
        x += 1
    except Exception as e:
        print(f"Error processing row {x}: {e}")
        x += 1

HtmlInject += f'''
<script>
{JStext}
</script>
</body>
'''
display(HtmlInject)