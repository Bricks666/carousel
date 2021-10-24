class Slider {
  #carousel;
  #slidesContainer;

  #nextButton;
  #prevButton;

  constructor(config = {}) {
    this.#carousel = document.querySelector(".carousel");
    this.#slidesContainer = new SlidesContainer(
      this.#carousel.querySelector(".carousel__slides")
    );

    this.#nextButton = this.#carousel.querySelector(".carousel__button--next");
    this.#prevButton = this.#carousel.querySelector(".carousel__button--prev");

    this.#prevButton.disabled = true;

    this.#slidesContainer.addEventListener("endSlide", () => {
      this.#nextButton.disabled = true;
    });
    this.#slidesContainer.addEventListener("notEndSlide", () => {
      this.#nextButton.disabled = false;
    });

    this.#slidesContainer.addEventListener("startSlide", () => {
      this.#prevButton.disabled = true;
    });
    this.#slidesContainer.addEventListener("notStartSlide", () => {
      this.#prevButton.disabled = false;
    });
  }

  initialization() {
    this.#slidesContainer.initialization({
      motionCoefficient: 1,
      gap: 20,
    });

    this.#nextButton.onclick = this.#next.bind(this);
    this.#prevButton.onclick = this.#prev.bind(this);
  }

  #next() {
    this.#slidesContainer.moveSlidesForward();
  }

  #prev() {
    this.#slidesContainer.moveSlidesBack();
  }
}

class SlidesContainer {
  #container;

  #slides = [];
  #firstSlide;
  #lastSlide;

  #configuration = {
    motionCoefficient: 1,
    gap: 0,
    loop: false,
    motion: 0,
    slideWidth: 0,
    dragMotion: 0,
    dragSensitiveCoefficient: 10,
  };

  #service = {
    isLastSlide: false,
    isFirstSlide: true,
  };

  #drag = {
    lastXPosition: 0,
  };

  constructor(container) {
    this.#container = container;

    const nodeSlides = this.#container.querySelectorAll(".carousel__slide");

    for (let nodeSlide of nodeSlides.entries()) {
      this.#slides.push(new Slide(nodeSlide[1], nodeSlide[0]));
    }

    this.#firstSlide = this.#slides[0];
    this.#lastSlide = this.#slides[this.#slides.length - 1];

    this.#dragSubscribe();
  }

  get width() {
    return parseFloat(getComputedStyle(this.#container).width);
  }

  get addEventListener() {
    return this.#container.addEventListener.bind(this.#container);
  }

  get #distanceToLeftBorder() {
    return -this.#firstSlide.distanceToBorder(0, 0);
  }

  get #distanceToRightBorder() {
    return this.#lastSlide.distanceToBorder(
      this.width,
      this.#configuration.slideWidth
    );
  }

  #dragSubscribe() {
    this.#container.ondragover = (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      const xPositionDifferent = this.#drag.lastXPosition - evt.clientX;

      if (
        xPositionDifferent > this.#configuration.dragSensitiveCoefficient &&
        this.#service.isLastSlide === false
      ) {
        console.log("To forward", xPositionDifferent);
        this.moveSlidesForward(this.#configuration.dragMotion);
      } else if (
        xPositionDifferent < -this.#configuration.dragSensitiveCoefficient &&
        this.#service.isFirstSlide == false
      ) {
        console.log("To back", xPositionDifferent);

        this.moveSlidesBack(this.#configuration.dragMotion);
      }

      this.#drag.lastXPosition = evt.clientX;
    };

    this.#container.addEventListener("dragend", (evt) => {
      evt.preventDefault();

      this.#drag.lastXPosition = 0;
    });
  }

  initialization(config = {}) {
    this.#configuration.slideWidth = this.#firstSlide.width;

    Object.assign(this.#configuration, config);

    this.#configuration.motion =
      (this.#configuration.slideWidth + this.#configuration.gap) *
      this.#configuration.motionCoefficient;

    this.#configuration.dragMotion = this.#configuration.motion / 2;

    this.#slides.forEach((slide, index) => {
      slide.move(
        (this.#configuration.slideWidth + this.#configuration.gap) * index
      );
    });
  }

  moveSlidesForward(motion) {
    const currentMotion = Math.min(
      motion || this.#configuration.motion,
      this.#distanceToRightBorder
    );

    if (currentMotion <= 0) {
      this.#container.dispatchEvent(new Event("endSlide"));
      this.#service.isLastSlide = true;
      return;
    }

    if (this.#service.isFirstSlide) {
      this.#container.dispatchEvent(new Event("notStartSlide"));
      this.#service.isFirstSlide = false;
    }

    this.#slides.forEach((slide) => {
      slide.move(-currentMotion);
    });
  }

  moveSlidesBack(motion) {
    const currentMotion = Math.min(
      motion || this.#configuration.motion,
      this.#distanceToLeftBorder
    );

    if (currentMotion <= 0) {
      this.#container.dispatchEvent(new Event("startSlide"));
      this.#service.isFirstSlide = true;
      return;
    }

    if (this.#service.isLastSlide) {
      this.#container.dispatchEvent(new Event("notEndSlide"));
      this.#service.isLastSlide = false;
    }

    this.#slides.forEach((slide) => {
      slide.move(currentMotion);
    });
  }
}

class Slide {
  #element;
  #number;

  constructor(slide, number) {
    this.#element = slide;
    this.#element.draggable = true;
    this.#number = number;
  }

  move(motion) {
    this.#element.style.left = `${
      parseFloat(this.#element.style.left || 0) + motion
    }px`;
  }

  distanceToBorder(border, slideWidth) {
    return parseFloat(this.#element.style.left) - (border - slideWidth);
  }

  get width() {
    return parseFloat(getComputedStyle(this.#element).width);
  }
}
