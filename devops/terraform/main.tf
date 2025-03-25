provider "aws" {
  region = "us-west-2"
}

terraform {
  backend "s3" {
    bucket = "tech-challenge-tf-state-bucket-d41d8"
    key    = "lambda/terraform.tfstate"
    region = "us-west-2"
    encrypt = true
  }
}