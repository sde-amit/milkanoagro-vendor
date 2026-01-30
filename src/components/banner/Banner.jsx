import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import banner1 from "../../assets/banner1.jpg";


const Banner = () => {


    return (
        <>
            <Carousel
                autoPlay
                interval={3000}
                transitionTime={500}
                infiniteLoop
                showThumbs={false}
                showArrows={true}
                showStatus={false}

            >
                <div>
                    <img src={banner1} style={{ objectFit: "cover" }} height="650px" width="100%" alt="" />
                </div>
            </Carousel>
        </>
    );
};

export default Banner;