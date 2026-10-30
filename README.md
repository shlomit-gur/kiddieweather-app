# Kiddie Weather

> Smart Child Dress & Forecast Advisor

![Project Banner or Logo](https://placeholder.com)

## Features

- Feature 1: Fast and lightweight setup
- Feature 2: Cross-platform support
- Feature 3: Clean API integration

## Built With

- [Node.js](https://nodejs.org)
- [React](https://reactjs.org)

## Known Issues

- [x] Activities should have location as well (the child's location be default)
  - [x] These locations should be taken into account when querying the relevant activities' suggestions
- [x] The hourly forecast should display also the UV
- [x] Should be able to query for the day also if an activity (or more) has already started (i.e., if the day's itinerary has already begun)
  - [x] Query the entire day's weather (since 00:00) every time it's queried (via past_days=1 in API and full 00:00 start in fallbacks)
- [x] Should be able to get suggestions for the next day (only) as well
- [x] Allow to add Children (have more than one child) to the app
- [x] Try to optimize the prompt - do we really need ALL the weather info we're sending? (Pruned 5 redundant properties: visibility, cloud_cover, precipitation mm, wind_gusts_10m, is_day)
- [x] Improve the display of "today's weather outlook" 
  - [x] Include max UV index with category and current reading
  - [x] Include min & max rain risk and min & max wind speed for the day
  - [x] Made metrics (rain risk, wind, UV, temperature) clickable to expand a 24-hour bar plot throughout the day with a "Now" indicator line showing where in time we currently are
  - [x] Made it crystal clear with explicit badge that larger text refers to "Current Temp" vs. the "Day" high/low range
- [x] What are these "Schedule & Weather Coverage"? They're buggy
- [x] "Pediatric Thermoregulation Tips" seems unnecessary
- [x] Don't need the "select single" vs. select multiple or 2 or all (or whatever it is) under "Plan for active routines"
- [x] In "24-Hour Forecast & Layer Transitions":
  - [x] Removed "Tap hour to view outfit" and extra hourly cards (excessive; recommendations are focused strictly on scheduled activities)
  - [?] Perhaps should display the 24 hours of *today* and focus on the time at time of load/refresh
  - [x] I'm not sure the "light knit", "single layer" etc. are accurate (refined "Light Knit" to pediatric-accurate "Long Sleeves")
- [x] Perhaps should separate the non clothing items and ask about them separately, more intenrional questions
  - [x] E.g., no need to waste an AI's time on unbrella - if there's 0% change for rain, no need for an unbrella. Otherwise, mention the exact times an unbrella might be needed.
  - [x] Also, ask specifically, separately, about the mosquito repellent
- [ ] Populate this file correctly
- [x] In the "7-Day Wardrobe & Schedule Outlook" include UV (with a 5-bar visual plot and color pill) and max wind speed with gusts. That's very important!
- [x] It appears that sometimes the "with" suggestion are not relevant to the time of the activity (e.g., if the activity is until 17:00 and it "gets below 24C" only around 19:00-20:00, there's no need to take a long thin layer... [2] "Rain possible around 6:00" when first activity starts at 07:30)


## Getting Started

### Prerequisites

List what you need to install the software (e.g., Node.js v18+, Git).

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in a `.env` file.

## Usage

Provide a quick code snippet or command to show how to run the project:

```bash
npm run start
```

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
