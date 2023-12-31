import fetch from 'node-fetch';
import promptSync from 'prompt-sync';
const prompt = promptSync();

let postCode = prompt("Which postcode would you like to search for?");
let requireJourneyPlan = prompt("Do you need directions to the bus stop?");

async function fetchLatLon(postcode) {
    const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`)
    return await response.json();
}

async function fetchStopPoints(lat, lon) {
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=50`)
    const data = await response.json();
    return data.stopPoints;
}

async function fetchLiveArrivals(id) {
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${id}/Arrivals`)
    return await response.json();
}

const latLonData = await fetchLatLon(postCode);
if(latLonData.status === 404) {
    console.log("Please enter a valid postcode")
} else {
    const lat = latLonData.result.latitude;
    const lon = latLonData.result.longitude;
    const stopPoints = await fetchStopPoints(lat, lon);
    const stopPointIds = [];
    if(!stopPoints) {
        console.log("Sorry, there are no bus stops nearby.")
    } else {
        stopPoints.map((stop) => {
            stopPointIds.push(stop.naptanId)
        })
    
        stopPointIds.map(async (id) => {
            const arrivalData = await fetchLiveArrivals(id);
            console.log(`${arrivalData[0].stationName} (${arrivalData[0].platformName})`);
            console.log(arrivalData[0].naptanId);
            if (!arrivalData) {
                console.log("Sorry there are no buses arriving")
            } else {
                arrivalData.sort((a, b) => a.timeToStation - b.timeToStation);
                if (requireJourneyPlan.toLowerCase() === "yes") {
                    const response = await fetch(`https://api.tfl.gov.uk/Journey/JourneyResults/${postCode}/to/${id}?timeIs=Arriving&journeyPreference=LeastInterchange&mode=bus&accessibilityPreference=NoRequirements&walkingSpeed=Slow&cyclePreference=None&bikeProficiency=Easy`)
                    const data = await response.json()
                    data.journeys.map((journey) => {
                        journey.legs.map((leg) => {
                            leg.instruction.steps.map((step) => {
                                console.log(step.descriptionHeading, step.description);
                            })
                        })
                    })
                }
                arrivalData.slice(0, 5).map(arrival => 
                console.log(`Bus ${arrival.lineName} to ${arrival.towards} arriving in ${arrival.timeToStation}`))
            }      
        })
    }
    
}









