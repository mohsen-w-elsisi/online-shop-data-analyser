# Laptop Data fron Various Online Shopping Sites

## Goal
This project aims to scrape and analyse laptop data in an effort to better understand what obtains better ratings. Additionally data about copurchased products is also analysed to better understand what products are more likely to get recommendedto customers while browsing.

## 1. Scraping
Multiple methods are used to scrape data 

1. Serbapi: for ebay. The api key is loaded from the enviornment.
2. Beautiful soup: for jumia, as it return static html
3. Selenium: for Noon, as it blocks requests from parties trying to scrape its data

The data from each website is saved to a seperate csv file and the aggregate data ius also saved in its own csv file.

for copurchased products, their urls were scraped from the main product page, and the same code was used to scrape them as well.

## 2. Standardisation
some listings has a range of possible prices and others had one discrete price. This data was standardised by giving a "solid" price to all listings by taking the average of the max and min prices of variable price listings.

## 3. Visualisation
depending on the visualisation, data would need to be cleaned. for example, when investigating the relationship between rating and price, some listings didn't have a ratin, so they were removed. 

matplotlib was used for visualisations along with networkx for the copurchased product graph.

## 4. Presentation
a web ui was developed. it uses papaparser to load the data from csv data and present some interesting numbers as an overview. to load the data and the exported visualisations to the web app, a shell script is used to reliably automate the process. 