Node.js Express MongoDB app for listing toilets in Copenhagen
===================================

Copenhagen toilets query page built using the Express Example App for a base.

This project is old and slightly messy so approach it with caution?

Head to Københavns Kommune's JSON geodata page for all toilets.

Database import:
mongoimport --file data/kk-toilets-open.json --jsonArray --db kktoiletslocater_dev --collection toiletopens