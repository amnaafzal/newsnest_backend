import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import cron from 'node-cron'

dotenv.config()

const app = express()

app.use(express.json())
app.use(bodyParser.json())
app.use(cors())

const url = "mongodb://localhost:27017";
const client = new MongoClient(process.env.ATLAS_URI);

client.connect();


const dbName = 'newsnest'


const get_news = async (source) => {

    let url = ""
    let class_name = ""


    // FOR DAWN NEWS

    if (source == "dawn") {
        url = 'https://www.dawn.com/latest-news'
        class_name = '.story'

        try {

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const headlines = [];

            $(class_name).each((i, el) => {
                const title = $(el).find('h2.story__title a').text().trim();
                const link = $(el).find('h2.story__title a').attr('href');
                const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
                const para = $(el).find('.story__excerpt').text().trim();
                if (title && link) {
                    headlines.push({
                        index: i,
                        title: title,
                        link: link,
                        img: img,
                        para: para
                    })
                }
            })

           
            return (headlines)

        }
        catch (error) {
            console.error(error)
            return []

        }

    }

    // FOR TRIBUNE NEWS

    else if (source == "tribune") {
        url = 'https://tribune.com.pk/latest'
        class_name = '.row'

        try {

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const headlines = [];



            $(class_name).each((i, el) => {
                const title = $(el).find('.title-heading').text().trim();
                const link = $(el).find('.title-heading').parent('a').attr('href')
                // const img = $(el).find('img').attr('src')
                const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
                const para = $(el).find('p').text().trim()
                if (title && link && img && para) {
                    headlines.push({
                        index: i,
                        title: title,
                        link: link,
                        img: img,
                        para: para
                    })
                }
            })

            
            return (headlines)

        }
        catch (error) {
            console.error(error)
            return []

        }

    }


    // FOR DAILY NEWS

    else if (source == "daily_times") {
        url = 'https://dailytimes.com.pk/tag/latest/'
        class_name = '.entry'

        try {

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const headlines = [];



            $(class_name).each((i, el) => {
                const title = $(el).find('h2.entry-title a').text().trim();
                const link = $(el).find('h2.entry-title a').attr('href');
                const img = $(el).find('a.entry-image-link img').attr('src');
                const para = $(el).find('.entry-content p').first().text().trim();
                if (title && link && img && para) {
                    headlines.push({
                        index: i,
                        title: title,
                        link: link,
                        img: img,
                        para: para
                    })
                }
            })

            
            return (headlines)

        }
        catch (error) {
            console.error(error)
            return []

        }

    }


    // FOR THE INERNATIONAL NEWS

    else if (source == "the_international_news") {
        url = 'https://www.thenews.com.pk/latest-stories'
        class_name = '.writter-list-item-story'

        try {

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const headlines = [];



            $(class_name).each((i, el) => {
                const title = $(el).find('h2 a').text().trim();
                const link = $(el).find('h2 a').attr('href');
                const img = $(el).find('a.latest-page-img img').attr('src');
                const para = $(el).find('p').text().trim();
                if (title && link && img && para) {
                    headlines.push({
                        index: i,
                        title: title,
                        link: link,
                        img: img,
                        para: para
                    })
                }
            })

            
            return (headlines)

        }
        catch (error) {
            console.error(error)
            return []

        }

    }


    else {
        throw new Error("Invalid news source provided.");
    }


}


const scrapAndStore = async (source) => {
    const headlines = await get_news(source)

    try {
        const db = client.db(dbName)
        const collection = db.collection(source)
        await collection.deleteMany({})
        await collection.insertMany(headlines)

        return({
            status: 'successful',
            count: headlines.length
        })
    }
    catch (error) {
        (
            {
                status: "unsuccessful",
                "message": error.message

            }
        )
    }
}


app.post('/:source', async (req, res) => {


    console.log("running")
    const source = req.params.source;
    try {
        scrapAndStore(source)
        res.json({
            status: 'successful',
            count: headlines.length
        })
    }
    catch (error) {
        res.status(500).json(
            {
                status: "unsuccessful",
                "message": error.message

            }
        )
    }


})


cron.schedule("*/30 * * * *", () => {

    console.log("cron sceduler running");
    scrapAndStore('dawn'),
    scrapAndStore('the_international_news')
    scrapAndStore('tribune')
    scrapAndStore('daily_times')

})



// GET STORED DATA

app.get('/:source', async (req, res) => {

    const source = req.params.source

    try {
        const db = client.db('newsnest')
        const collection = db.collection(source)
        const headlines = await collection.find({}).toArray()


        res.json({
            status: "successful",
            count: headlines.length,
            data: headlines
        })

    }
    catch (error) {
        res.json({
            status: 'unsuccessful',
            message: error.message
        })
    }



})








const PORT = 5000;

app.listen(PORT, () => {
    console.log("serve is live now")
})


