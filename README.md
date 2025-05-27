Node.js Express MongoDB app for listing toilets in Copenhagen
===================================

This project is old and slightly messy so approach it with caution?

Head to Københavns Kommune's GEOJSON data page to download all toilets.

### Database import:
`mongoimport --file data/kk-toilets-open.json --jsonArray --db kktoiletslocater_dev --collection toiletopens`
