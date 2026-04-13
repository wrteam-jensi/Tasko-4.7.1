// "use client";
// import axios from 'axios';

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     const { input } = req.query;
//     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_PLACE_API_KEY; // Your API key

//     try {
//       // Call the Google Places Autocomplete API
//       const autocompleteResponse = await axios.get(
//         'https://maps.googleapis.com/maps/api/place/autocomplete/json',
//         {
//           params: {
//             input,
//             key: apiKey,
//           },
//         }
//       );

//       const predictions = autocompleteResponse.data.predictions;

//       // Fetch latitude and longitude for each prediction using Place Details API
//       const enrichedSuggestions = await Promise.all(
//         predictions.map(async (place) => {
//           const placeDetailsResponse = await axios.get(
//             'https://maps.googleapis.com/maps/api/place/details/json',
//             {
//               params: {
//                 place_id: place.place_id,
//                 key: apiKey,
//               },
//             }
//           );

//           const { geometry } = placeDetailsResponse.data.result || {};
//           return {
//             description: place.description,
//             place_id: place.place_id,
//             lat: geometry?.location?.lat,
//             lng: geometry?.location?.lng,
//           };
//         })
//       );

//       res.status(200).json({ predictions: enrichedSuggestions });
//     } catch (error) {
//       console.error('Error fetching places:', error);
//       res.status(500).json({ error: 'Error fetching places' });
//     }
//   } else {
//     // Handle unsupported HTTP methods
//     res.status(405).json({ error: 'Method Not Allowed' });
//   }
// }
