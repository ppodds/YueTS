FROM node:16.14.0-bullseye

RUN mkdir -p /app

WORKDIR /app

ARG USERNAME=node
RUN apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

CMD ["/bin/bash"]